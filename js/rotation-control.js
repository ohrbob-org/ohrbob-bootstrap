(function () {
    const ORDER = [1, 2, 0];
    const LABELS = {
        1: 'newest to oldest',
        2: 'random',
        0: 'oldest to newest',
    };
    const INSET = 2;
    const FALLBACK_THUMB_WIDTH = 20;
    const DRAG_THRESHOLD = 3;

    function thumbWidth(thumb) {
        const rectWidth = thumb.getBoundingClientRect().width;
        if (rectWidth > 0) return rectWidth;
        if (thumb.offsetWidth > 0) return thumb.offsetWidth;
        return FALLBACK_THUMB_WIDTH;
    }

    function paddingWidth(track) {
        return Math.max(0, track.getBoundingClientRect().width - 2);
    }

    function leftForValue(track, thumb, value) {
        const width = paddingWidth(track);
        const size = thumbWidth(thumb);
        const maximum = Math.max(INSET, width - INSET - size);
        if (value === 1) return INSET;
        if (value === 2) return (width - size) / 2;
        return maximum;
    }

    function leftForPointer(track, thumb, clientX) {
        const rect = track.getBoundingClientRect();
        const size = thumbWidth(thumb);
        const maximum = Math.max(INSET, paddingWidth(track) - INSET - size);
        return Math.min(maximum, Math.max(INSET, clientX - rect.left - size / 2));
    }

    function valueForLeft(track, thumb, left) {
        const size = thumbWidth(thumb);
        const maximum = Math.max(INSET, paddingWidth(track) - INSET - size);
        const minimumCenter = INSET + size / 2;
        const maximumCenter = maximum + size / 2;
        const center = Math.min(maximumCenter, Math.max(minimumCenter, left + size / 2));
        const progress = maximumCenter === minimumCenter
            ? 0
            : (center - minimumCenter) / (maximumCenter - minimumCenter);
        return progress < 1 / 3 ? 1 : (progress < 2 / 3 ? 2 : 0);
    }

    function setThumbPosition(thumb, left, animate) {
        thumb.style.transition = animate ? '' : 'none';
        thumb.style.left = `${left}px`;
        thumb.style.transform = 'translateX(0)';
    }

    function setIcon(thumb, value) {
        const icon = thumb.querySelector('i');
        if (!icon) return;
        icon.className = value === 1
            ? 'bi bi-sort-down'
            : (value === 2 ? 'bi bi-shuffle' : 'bi bi-sort-up');
    }

    function ensureTooltip(track) {
        const host = track.closest('.playback-order-toggle-container') || track;
        let tooltip = host.querySelector('.rotation-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('span');
            tooltip.className = 'rotation-tooltip';
            tooltip.setAttribute('role', 'tooltip');
            tooltip.setAttribute('aria-hidden', 'true');
            host.appendChild(tooltip);
        }
        return { host: host, tooltip: tooltip };
    }

    function setTooltip(track, value) {
        const label = LABELS[value] || LABELS[1];
        track.setAttribute('aria-valuetext', label);
        const host = track.closest('.playback-order-toggle-container');
        const tooltip = host ? host.querySelector('.rotation-tooltip') : null;
        if (tooltip) tooltip.textContent = label;
    }

    function setValue(track, value, options) {
        options = options || {};
        value = Number(value);
        if (value !== 0 && value !== 1 && value !== 2) value = 1;

        track.setAttribute('aria-valuenow', String(value));
        const thumb = track.querySelector('.slider-thumb-container');
        if (thumb) {
            setThumbPosition(thumb, leftForValue(track, thumb, value), options.animate !== false);
            setIcon(thumb, value);
        }
        setTooltip(track, value);

        const input = track.closest('.playback-order-toggle-container')
            ?.querySelector('.playback-order-value');
        if (input) input.value = String(value);

        track.dispatchEvent(new CustomEvent('rotationchange', {
            bubbles: true,
            detail: { value: value },
        }));
    }

    function init(track) {
        if (track.dataset.rotationReady === 'true') return;
        const thumb = track.querySelector('.slider-thumb-container');
        if (!thumb) return;
        track.dataset.rotationReady = 'true';

        const tooltipParts = ensureTooltip(track);
        let activePointer = null;
        let startX = 0;
        let moved = false;
        let lastValue = Number(track.getAttribute('aria-valuenow') ?? 1);
        let tooltipTimer = null;

        function showTooltip(lingerMilliseconds) {
            tooltipParts.host.classList.add('is-tooltip-visible');
            if (tooltipTimer) {
                clearTimeout(tooltipTimer);
                tooltipTimer = null;
            }
            if (lingerMilliseconds > 0) {
                tooltipTimer = setTimeout(function () {
                    tooltipParts.host.classList.remove('is-tooltip-visible');
                    tooltipTimer = null;
                }, lingerMilliseconds);
            }
        }

        setValue(track, lastValue, { animate: false });

        track.addEventListener('pointerdown', function (event) {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            activePointer = event.pointerId;
            startX = event.clientX;
            moved = false;
            if (tooltipTimer) {
                clearTimeout(tooltipTimer);
                tooltipTimer = null;
            }
            tooltipParts.host.classList.remove('is-tooltip-visible');
            track.classList.add('is-dragging');
            if (track.setPointerCapture) {
                try { track.setPointerCapture(event.pointerId); } catch (_) { /* best effort */ }
            }
            event.preventDefault();
        });

        track.addEventListener('pointermove', function (event) {
            if (activePointer !== event.pointerId) return;
            if (!moved && Math.abs(event.clientX - startX) > DRAG_THRESHOLD) {
                moved = true;
                tooltipParts.host.classList.add('is-dragging');
                showTooltip(0);
            }
            if (!moved) return;

            const left = leftForPointer(track, thumb, event.clientX);
            setThumbPosition(thumb, left, false);
            const value = valueForLeft(track, thumb, left);
            if (value !== lastValue) {
                lastValue = value;
                track.setAttribute('aria-valuenow', String(value));
                setIcon(thumb, value);
                setTooltip(track, value);
            }
        });

        function finish(event) {
            if (activePointer !== event.pointerId) return;
            activePointer = null;
            track.classList.remove('is-dragging');
            tooltipParts.host.classList.remove('is-dragging');
            if (track.releasePointerCapture) {
                try { track.releasePointerCapture(event.pointerId); } catch (_) { /* best effort */ }
            }

            const left = leftForPointer(track, thumb, event.clientX);
            setValue(track, valueForLeft(track, thumb, left), { animate: true });
            showTooltip(2000);
        }

        track.addEventListener('pointerup', finish);
        track.addEventListener('pointercancel', finish);

        track.querySelectorAll('.playback-node-btn').forEach(function (button, index) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                button.blur();
                setValue(track, ORDER[index], { animate: true });
                showTooltip(2000);
            });
        });
    }

    function initRotationControls(root) {
        (root || document).querySelectorAll('.playback-order-toggle').forEach(init);
    }

    window.initRotationControls = initRotationControls;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { initRotationControls(); });
    } else {
        initRotationControls();
    }
})();
