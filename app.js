(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  var recognition  = null;
  var isListening  = false;
  var finalText    = '';
  var fnHoldTimer  = null;
  var fnPushToTalk = false;
  var toastTimer   = null;

  // ── DOM ────────────────────────────────────────────────
  var elLogoDot   = document.getElementById('logo-dot');
  var elTranscript= document.getElementById('transcript-text');
  var elInterim   = document.getElementById('interim-text');
  var elPlaceholder= document.getElementById('placeholder');
  var elWaveform  = document.getElementById('waveform');
  var elStatus    = document.getElementById('status-text');
  var elWordCount = document.getElementById('word-count');
  var elMicBtn    = document.getElementById('mic-btn');
  var elMicIcon   = document.getElementById('mic-icon');
  var elCopyBtn   = document.getElementById('copy-btn');
  var elClearBtn  = document.getElementById('clear-btn');
  var elToggleBtn = document.getElementById('toggle-btn');
  var elLang      = document.getElementById('lang-select');
  var elToast     = document.getElementById('toast');
  var elWrap      = document.getElementById('transcript-wrap');
  var elBanner    = document.getElementById('permission-banner');

  // ── Init ───────────────────────────────────────────────
  function init() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      elStatus.textContent = 'Speech API unavailable — please use Chrome or Edge';
      elMicBtn.disabled    = true;
      elToggleBtn.disabled = true;
      return;
    }

    // Restore saved language preference
    try {
      chrome.storage.local.get('vf_lang', function (r) {
        if (r && r.vf_lang) { elLang.value = r.vf_lang; }
      });
    } catch (e) {}

    elLang.addEventListener('change', function () {
      try { chrome.storage.local.set({ vf_lang: elLang.value }); } catch (e) {}
    });

    // Button listeners
    elMicBtn.addEventListener('click', toggleMic);
    elToggleBtn.addEventListener('click', toggleMic);
    elCopyBtn.addEventListener('click', copyText);
    elClearBtn.addEventListener('click', clearText);

    // Sync manual edits in the transcript box
    elTranscript.addEventListener('input', function () {
      finalText = elTranscript.textContent || '';
      updateButtons();
      updateWordCount();
      elPlaceholder.style.display = finalText.trim().length > 0 ? 'none' : '';
    });

    setupRecognition(SR);
  }

  // ── Speech Recognition ─────────────────────────────────
  function setupRecognition(SR) {
    recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;

    recognition.onstart = function () {
      isListening = true;
      elMicBtn.classList.add('listening');
      elMicIcon.textContent = '\u23F9';       // stop square ⏹
      elLogoDot.classList.add('live');
      elWaveform.classList.add('active');
      elToggleBtn.textContent = 'Stop recording';
      elBanner.classList.remove('show');
      elPlaceholder.style.display = 'none';
      elStatus.textContent = 'Listening — speak now...';
    };

    recognition.onend = function () {
      isListening = false;
      elMicBtn.classList.remove('listening');
      elMicIcon.textContent = '\uD83C\uDF99'; // microphone 🎙
      elLogoDot.classList.remove('live');
      elWaveform.classList.remove('active');
      elInterim.textContent   = '';
      elToggleBtn.textContent = 'Start recording';
      var has = finalText.trim().length > 0;
      elStatus.textContent = has
        ? 'Done! Click "Copy to clipboard" then paste into Claude or ChatGPT'
        : 'Click the mic button to start speaking';
      updateWordCount();
    };

    recognition.onerror = function (e) {
      isListening = false;
      elMicBtn.classList.remove('listening');
      elMicIcon.textContent = '\uD83C\uDF99';
      elLogoDot.classList.remove('live');
      elWaveform.classList.remove('active');
      elToggleBtn.textContent = 'Start recording';

      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        elBanner.classList.add('show');
        elStatus.textContent = 'Microphone permission denied — see instructions above';
      } else if (e.error === 'no-speech') {
        elStatus.textContent = 'No speech detected — try again';
      } else if (e.error !== 'aborted') {
        elStatus.textContent = 'Error: ' + e.error + ' — please try again';
      }
    };

    recognition.onresult = function (e) {
      finalText = '';
      var interim = '';
      for (var i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      elTranscript.textContent = finalText;
      elInterim.textContent    = interim;
      elPlaceholder.style.display = 'none';
      updateButtons();
      updateWordCount();
      elWrap.scrollTop = elWrap.scrollHeight;
    };
  }

  // ── Toggle microphone ──────────────────────────────────
  function toggleMic() {
    if (!recognition) { return; }
    if (isListening) {
      try { recognition.stop(); } catch (e) {}
    } else {
      recognition.lang = elLang.value || 'en-US';
      try {
        recognition.start();
      } catch (e) {
        elStatus.textContent = 'Could not start microphone — please try again';
      }
    }
  }

  // ── Copy to clipboard ──────────────────────────────────
  function copyText() {
    var text = finalText.trim() || (elTranscript.textContent || '').trim();
    if (!text) { return; }

    navigator.clipboard.writeText(text).then(function () {
      elCopyBtn.textContent = 'Copied!';
      elCopyBtn.classList.add('copied');
      showToast('Copied! Paste into Claude, ChatGPT or Gemini with Cmd+V');
      setTimeout(function () {
        elCopyBtn.textContent = 'Copy to clipboard';
        elCopyBtn.classList.remove('copied');
      }, 2500);
    }).catch(function () {
      // Fallback for environments where clipboard API is restricted
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch (ex) {}
      document.body.removeChild(ta);
      showToast('Copied!');
    });
  }

  // ── Clear transcript ───────────────────────────────────
  function clearText() {
    finalText = '';
    elTranscript.textContent = '';
    elInterim.textContent    = '';
    elPlaceholder.style.display = '';
    updateButtons();
    updateWordCount();
    elStatus.textContent = 'Click the mic button to start speaking';
  }

  // ── UI helpers ─────────────────────────────────────────
  function updateButtons() {
    var has = (finalText || elTranscript.textContent || '').trim().length > 0;
    elCopyBtn.disabled  = !has;
    elClearBtn.disabled = !has;
  }

  function updateWordCount() {
    var text = (finalText || elTranscript.textContent || '').trim();
    if (!text) { elWordCount.textContent = ''; return; }
    var n = text.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
    elWordCount.textContent = n + (n === 1 ? ' word' : ' words');
  }

  function showToast(msg) {
    elToast.textContent = msg;
    elToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      elToast.classList.remove('show');
    }, 3200);
  }

  // ── Fn key — tap = toggle, hold = push-to-talk ─────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      copyText();
      return;
    }
    if (e.key === 'Fn') {
      e.preventDefault();
      if (fnHoldTimer === null && !fnPushToTalk) {
        fnHoldTimer = setTimeout(function () {
          fnPushToTalk = true;
          if (!isListening) { toggleMic(); }
        }, 280);
      }
    }
  });

  document.addEventListener('keyup', function (e) {
    if (e.key === 'Fn') {
      e.preventDefault();
      if (fnHoldTimer !== null) {
        clearTimeout(fnHoldTimer);
        fnHoldTimer = null;
      }
      if (fnPushToTalk) {
        fnPushToTalk = false;
        if (isListening) { try { recognition.stop(); } catch (ex) {} }
      } else {
        toggleMic();
      }
    }
  });

  // ── Start ──────────────────────────────────────────────
  init();

}());
