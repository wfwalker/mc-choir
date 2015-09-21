// app.js

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundSource = null;
var gSounds = {};

function getArrayBuffer(url) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function() {
      // This is called even on 404 etc so check the status
      if (req.status == 200) {
        // Resolve the promise with the response body
        resolve(req.response);
      }
      else {
        // Otherwise reject with the status text which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    };

    // Make the request
	req.responseType = 'arraybuffer';
    req.send();
  });
}

function decodeAudioDataAsync(data){
    return new Promise(function(resolve, reject){
         gAudioContext.decodeAudioData(data, resolve, reject);
    });
}

function loadSound(inSoundDataURL) {
	return getArrayBuffer(inSoundDataURL).then(function(response) {
		console.log('loaded', inSoundDataURL);
	    return decodeAudioDataAsync(response);
	}).then(function(decodedBuffer) {
		console.log('decoded', inSoundDataURL);
		gSounds[inSoundDataURL] = decodedBuffer;
	});
}

$(document).ready(function() {
	var loadPromises = [];

	$('input').each(function (index) {
		loadPromises.push(loadSound($(this).attr('data-url')));
	});

	Promise.all(loadPromises).then(function () {
		console.log('loaded all sounds');
	});

	// respond to a click on the play button either by:
	// starting the sound indicated by the radio buttons, if the play button is not checked
	// stopping the currently playing sound, if the play button is checked

	$('button').click(function (e) {
		e.preventDefault();

		$(this).toggleClass('checked');

		if ($(this).hasClass('checked')) {
			var activeRadioButton = $(this).parent().parent().find('.btn-group label.active input');
			var soundURL = activeRadioButton.data('url');
			var rates = (activeRadioButton.data('rates')+"").split(',').map(function(str) { return parseFloat(str); });
			var randomRate = rates[Math.floor(Math.random() * rates.length)];

			console.log('START', activeRadioButton, soundURL, randomRate);

			if (gSounds[soundURL]) {
				// start playing immediately in a loop
				gSoundSource = gAudioContext.createBufferSource();
				gSoundSource.connect(gAudioContext.destination);
				gSoundSource.buffer = gSounds[soundURL];
				gSoundSource.loop = true;
				gSoundSource.playbackRate.linearRampToValueAtTime(randomRate, gAudioContext.currentTime);
				gSoundSource.start(0);
			} else {
				console.log('ERROR, did not find in library', soundURL);
			}
		} else {
			console.log('STOP');
			gSoundSource.stop(0);
			gSoundSource.disconnect();
		}

	});

	$(document).on('change', 'input:radio', function (e) {
		e.preventDefault();
		console.log('clicked selector', e.target);
	});
});