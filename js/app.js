// app.js

var gAudioContext = new AudioContext();
var gSoundSource = null;

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

function setBufferFromURL(inSoundDataURL) {
	return getArrayBuffer(inSoundDataURL).then(function(response) {
	    return gAudioContext.decodeAudioData(response);
	}).then(function(decodedBuffer) {
		gSoundSource = gAudioContext.createBufferSource();
		gSoundSource.connect(gAudioContext.destination);
		gSoundSource.buffer = decodedBuffer;
	});
}

$(document).ready(function() {
	$('button').click(function (e) {
		e.preventDefault();

		$(this).toggleClass('checked');

		if ($(this).hasClass('checked')) {
			var activeRadioButton = $(this).parent().parent().find('.btn-group label.active input');
			var soundURL = activeRadioButton.data('url');
			var rates = (activeRadioButton.data('rates')+"").split(',').map(function(str) { return parseFloat(str); });
			var randomRate = rates[Math.floor(Math.random() * rates.length)];

			console.log('START', activeRadioButton, soundURL, randomRate);
			setBufferFromURL(soundURL).then(function () {
				// start playing immediately in a loop
				gSoundSource.loop = true;
				gSoundSource.playbackRate.linearRampToValueAtTime(randomRate, gAudioContext.currentTime);
				gSoundSource.start(0);
			});
		} else {
			console.log('STOP');
			gSoundSource.stop(0);
			gSoundSource.disconnect();
		}

	});

	$(document).on('change', 'input:radio', function (e) {
		e.preventDefault();
		console.log('clicked selector', e.target.id);
	});
});