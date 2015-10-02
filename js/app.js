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
var gReversedSounds = {};
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

function createReverseBuffer(inForwardBuffer) {
	var forwardChannelData = inForwardBuffer.getChannelData(0);
	var forwardArray = Array.prototype.slice.call( forwardChannelData );
	Array.prototype.reverse.call(forwardArray);	

	var reverseBuffer = gAudioContext.createBuffer(1, inForwardBuffer.length, inForwardBuffer.sampleRate);
	var reverseChannelData = reverseBuffer.getChannelData(0);

	for (i = 0; i < reverseBuffer.length; i++) {
		reverseChannelData[i] = forwardArray[i];
	}

	return reverseBuffer;
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
		$('#loadingStatus').text('LOADED ' + inSoundDataURL);
		$('.progress-bar').css("width", Math.floor(100 * gSoundProgress / gSoundTotal) + "%");
	    return decodeAudioDataAsync(response);
	}).then(function(decodedBuffer) {
		gSounds[inSoundDataURL] = decodedBuffer;

		gSoundProgress++;
		$('#loadingStatus').text('DECODED ' + inSoundDataURL);
		$('.progress-bar').css("width", Math.floor(100 * gSoundProgress / gSoundTotal) + "%");

		gReversedSounds[inSoundDataURL] = createReverseBuffer(decodedBuffer);

		gSoundProgress++;
		$('#loadingStatus').text('REVERSED ' + inSoundDataURL);
		$('.progress-bar').css("width", Math.floor(100 * gSoundProgress / gSoundTotal) + "%");
	}).catch(function(e) {
		console.log('ERROR', e);
	});
}

function loadAllSounds() {
	$('#loadingModal').modal('show');

	var loadPromises = [];

	// find all the radio button tags, assume all their values are soundfile URL's, load them.

	$('label.checkbox-inline input').each(function (index) {
		loadPromises.push(loadSound($(this).attr('value')));
	});

	// there are three tasks for each soundfile, to load, to decode, and to reverse

	gSoundTotal = 3 * loadPromises.length;

	Promise.all(loadPromises).then(function () {
		console.log('loaded all sounds');
		$('#loadingModal').modal('hide');
	});
}

function startPlayingSound(activeRadioButton) {
	var soundURL = activeRadioButton.attr('value');
	var rates = (activeRadioButton.data('rates')+"").split(',').map(function(str) { return parseFloat(str); });
	var randomRate = rates[Math.floor(Math.random() * rates.length)];

	if (gSounds[soundURL]) {
		// start playing immediately in a loop
		var newSoundSource = gAudioContext.createBufferSource();
		newSoundSource.connect(gAudioContext.destination);

		// play forwards or backwards, at random
		if (Math.random() > 0.5) {
			newSoundSource.buffer = gSounds[soundURL];
		} else {
			newSoundSource.buffer = gReversedSounds[soundURL];
		}

		newSoundSource.loop = true;
		newSoundSource.playbackRate.linearRampToValueAtTime(randomRate, gAudioContext.currentTime);
		newSoundSource.start(0);
		gSoundSources[soundURL] = newSoundSource;
		console.log('STARTED', soundURL, gSoundSources[soundURL]);
		$('#soundInfo').text(soundURL + ', ' + rates + ' -> ' + randomRate);
	} else {
		console.log('ERROR, did not find in library', soundURL);
	}
}

function stopPlayingSound(activeRadioButton) {
	var soundURL = activeRadioButton.attr('value');

	if (gSoundSources[soundURL]) {
		gSoundSources[soundURL].stop(0);
		gSoundSources[soundURL].disconnect();
		gSoundSources[soundURL] = null;
		$('#soundInfo').text('');
		console.log('STOPPED', soundURL);		
	} else {
		console.log('not playing, stop does nothing');
	}
}

// check the status of the SW
if ('serviceWorker' in navigator) {
	if (navigator.serviceWorker.controller) {
		console.log('SW controller');

		// as soon as the SW is ready, ask it to update
		navigator.serviceWorker.ready.then(function(registration) {
			console.log('calling update');
			registration.update().then(function() {
				console.log('updated');
			}).catch(function (e) {
				console.log('update failed', e);
			})

			console.log('called update');
		});
	} else {
		console.log('NO CONTROLLER');
	}
} else {
	console.log('NO SERVICEWORKERS');
}

$(document).ready(function() {
	// load all the sounds first
	loadAllSounds();

	$('#halt').click(function (e) {
		$('label.checkbox-inline input').each(function (index) {
			stopPlayingSound($(this));
			$(this).removeClass('checked');
			$(this).attr('checked', false);
		});
	});

	// respond to a checkbox event either by starting or stopping sound
	$(document).on('change', 'input:checkbox', function (e) {
		$(this).toggleClass('checked');

		if ($(this).hasClass('checked')) {
			console.log('CHECKED', $(this));
			startPlayingSound($(this));
		} else {
			console.log('UNCHECKED', $(this));
			stopPlayingSound($(this));
		}
	});
});