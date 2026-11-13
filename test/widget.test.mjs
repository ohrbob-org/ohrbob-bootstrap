import test from 'node:test';
import assert from 'node:assert/strict';
import { mount, record } from './helpers/dom.mjs';

test('renders full-width bar structure', () => {
    const { el } = mount({ station: 'Test', track: 'T', artist: 'A' });
    const bar = el.querySelector('.audio-bar');
    assert.ok(bar);
    
    // Test groups
    const groups = [...bar.children].map(c => c.className.split(' ')[0]);
    assert.deepEqual(groups, [
        'audio-meta',
        'audio-controls',
        'audio-progress-group',
        'audio-volume-group',
        'btn-menu'
    ]);
});

test('renders expanded card structures', () => {
    const { el } = mount({ station: 'Test', track: 'T', artist: 'A' });
    const card = el.querySelector('.audio-expanded-card');
    assert.ok(card);
    
    const title = card.querySelector('.expanded-title');
    assert.equal(title.textContent, 'T');
});

test('manages isExpanded property and updates CSS classes and emits events', () => {
    const { el } = mount();
    const log = record(el, ['expand', 'collapse']);
    
    assert.equal(el.isExpanded, false);
    assert.ok(!el.classList.contains('is-expanded'));
    
    el.isExpanded = true;
    assert.equal(el.isExpanded, true);
    assert.ok(el.classList.contains('is-expanded'));
    assert.equal(log[0].type, 'expand');
    
    el.isExpanded = false;
    assert.equal(el.isExpanded, false);
    assert.ok(!el.classList.contains('is-expanded'));
    assert.equal(log[1].type, 'collapse');
});

test('parses and populates next and previous episode cards', () => {
    const nextEpisode = { track: 'Next Track', artist: 'Next Artist', duration: 1200 };
    const prevEpisode = { track: 'Prev Track', artist: 'Prev Artist', duration: 600 };
    
    const { el } = mount({
        'next-episode': JSON.stringify(nextEpisode),
        'prev-episode': JSON.stringify(prevEpisode)
    });
    
    const nextTitle = el.querySelector('.next-episode-card .episode-nav-title');
    const nextArtist = el.querySelector('.next-episode-card .episode-nav-artist');
    assert.equal(nextTitle.textContent, 'Next Track');
    assert.equal(nextArtist.textContent, 'Next Artist');
    
    const prevTitle = el.querySelector('.prev-episode-card .episode-nav-title');
    const prevArtist = el.querySelector('.prev-episode-card .episode-nav-artist');
    assert.equal(prevTitle.textContent, 'Prev Track');
    assert.equal(prevArtist.textContent, 'Prev Artist');
});

test('emits jumpnext and jumpprev events when navigation jump triggers are clicked', () => {
    const nextEpisode = { track: 'Next Track', artist: 'Next Artist' };
    const prevEpisode = { track: 'Prev Track', artist: 'Prev Artist' };
    
    const { el } = mount({
        'next-episode': JSON.stringify(nextEpisode),
        'prev-episode': JSON.stringify(prevEpisode)
    });
    const log = record(el, ['jumpnext', 'jumpprev']);
    
    const nextBtn = el.querySelector('.js-jump-next');
    nextBtn.click();
    assert.equal(log[0].type, 'jumpnext');
    assert.equal(log[0].detail.episode.track, 'Next Track');
    
    const prevBtn = el.querySelector('.js-jump-prev');
    prevBtn.click();
    assert.equal(log[1].type, 'jumpprev');
    assert.equal(log[1].detail.episode.track, 'Prev Track');
});

test('meta area shows cover art only, without station, title or artist', () => {
    const { el } = mount({
        station: 'Hidden Station',
        track: 'Hidden Track',
        artist: 'Hidden Artist',
        cover: 'cover.png',
    });
    assert.equal(el.querySelector('.audio-info'), null);
    assert.equal(el.querySelector('.station-name'), null);
    assert.equal(el.querySelector('.track-title'), null);
    assert.equal(el.querySelector('.track-description'), null);
    assert.ok(el.querySelector('.track-cover'));
    // Expansion markup still carries the attributes; the bar itself must not.
    assert.ok(!el.querySelector('.audio-bar').textContent.includes('Hidden'));
});
