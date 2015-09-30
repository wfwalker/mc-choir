// app.js

// REDIRECT to HTTPS!
var host = "wfwalker.github.io";
if ((host == window.location.host) && (window.location.protocol != "https:")) {
	window.location.protocol = "https";
}

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundSources = {};
var gSounds = {};
var gSoundProgress = 0;
var gSoundTotal = 0;

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
	// TODO may not work in nightly 
    return new Promise(function(resolve, reject){
         gAudioContext.decodeAudioData(data, resolve, reject);
    });
}

function loadSound(inSoundDataURL) {
	return getArrayBuffer(inSoundDataURL).then(function(response) {
		gSoundProgress++;
		$('.progress-bar').css("width", Math.floor(100 * gSoundProgress / gSoundTotal) + "%");
	    return decodeAudioDataAsync(response);
	}).then(function(decodedBuffer) {
		gSoundProgress++;
		$('.progress-bar').css("width", Math.floor(100 * gSoundProgress / gSoundTotal) + "%");
		gSounds[inSoundDataURL] = decodedBuffer;
	});
}

$(document).ready(function() {
	var loadPromises = [];

	// find all the radio button tags, assume all their values are soundfile URL's, load them.

	$('label.radio-inline input').each(function (index) {
		loadPromises.push(loadSound($(this).attr('value')));
	});

	// there are two tasks for each soundfile, to load and to decode

	gSoundTotal = 2 * loadPromises.length;

	Promise.all(loadPromises).then(function () {
		console.log('loaded all sounds');
		$('.progress').hide();
	});

	// respond to a click on the play button either by:
	// starting the sound indicated by the radio buttons, if the play button is not checked
	// stopping the currently playing sound, if the play button is checked

	$('#play').click(function (e) {
		var buttonID = e.target.id;

		$(this).toggleClass('checked');

		if ($(this).hasClass('checked')) {
			var activeRadioButton = $('label.radio-inline input:checked');
			var soundURL = activeRadioButton.attr('value');
			var rates = (activeRadioButton.data('rates')+"").split(',').map(function(str) { return parseFloat(str); });
			var randomRate = rates[Math.floor(Math.random() * rates.length)];

			console.log('START', activeRadioButton, soundURL, randomRate);

			if (gSounds[soundURL]) {
				// start playing immediately in a loop
				var newSoundSource = gAudioContext.createBufferSource();
				newSoundSource.connect(gAudioContext.destination);
				newSoundSource.buffer = gSounds[soundURL];
				newSoundSource.loop = true;
				newSoundSource.playbackRate.linearRampToValueAtTime(randomRate, gAudioContext.currentTime);
				newSoundSource.start(0);
				gSoundSources[buttonID] = newSoundSource;
				console.log('STARTED', buttonID, gSoundSources[buttonID]);
				$('#soundInfo').text(soundURL + ', ' + rates + ' -> ' + randomRate);
			} else {
				console.log('ERROR, did not find in library', soundURL);
			}
		} else {
			console.log('STOP', buttonID, gSoundSources[buttonID]);
			gSoundSources[buttonID].stop(0);
			gSoundSources[buttonID].disconnect();
			$('#soundInfo').text('');
		}

	});

	$(document).on('change', 'input:radio', function (e) {
		e.preventDefault();
		console.log('clicked selector', e.target);
	});
});