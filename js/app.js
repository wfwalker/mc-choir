// app.js

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
	console.time('reverse' + inForwardBuffer.length);
	var forwardChannelData = inForwardBuffer.getChannelData(0);
	var reverseBuffer = gAudioContext.createBuffer(1, inForwardBuffer.length, inForwardBuffer.sampleRate);
	var reverseChannelData = reverseBuffer.getChannelData(0);
	var j = inForwardBuffer.length;

	for (var i = 0; i < reverseBuffer.length; i++) {
		reverseChannelData[i] = forwardChannelData[--j];
	}

	console.timeEnd('reverse' + inForwardBuffer.length);
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
		$('.progress-bar').css("width", Math.floor(100 * gSoundProgress / gSoundTotal) + "%");
		console.time('decode' + inSoundDataURL);
		$('#loadingStatus').text('DECODE ' + inSoundDataURL);
	    return decodeAudioDataAsync(response);
	}).then(function(decodedBuffer) {
		console.timeEnd('decode' + inSoundDataURL);
		gSounds[inSoundDataURL] = decodedBuffer;

		gSoundProgress++;
		$('.progress-bar').css("width", Math.floor(100 * gSoundProgress / gSoundTotal) + "%");

		$('#loadingStatus').text('REVERSE ' + inSoundDataURL);
		gReversedSounds[inSoundDataURL] = createReverseBuffer(decodedBuffer);

		gSoundProgress++;
		$('#loadingStatus').text('DONE ' + inSoundDataURL);
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

		// compute random offset
		var offset = Math.random() * newSoundSource.buffer.duration;
		console.log('duration', newSoundSource.buffer.duration, 'offset', offset);

		newSoundSource.loop = true;
		newSoundSource.playbackRate.linearRampToValueAtTime(randomRate, gAudioContext.currentTime);
		newSoundSource.start(0, offset);
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
		// console.log('not playing, stop does nothing');
	}
}

function stopPlayingAllSounds() {
	$('label.checkbox-inline input').each(function (index) {
		stopPlayingSound($(this));
		$(this).removeClass('checked');
		$(this).attr('checked', false);
	});
}

function stopPlayingAllOtherSounds(inCheckbox) {
	$('label.checkbox-inline input').each(function (index) {
		if ($(this).attr('value') == inCheckbox.attr('value')) {
			// console.log('skip stopping', inCheckbox.attr('value'));
		} else {
			// console.log('do not skip', inCheckbox.attr('value'), $(this).attr('value'))
			stopPlayingSound($(this));
			$(this).removeClass('checked');
			$(this).attr('checked', false);
		}
	});
}

function updateServiceWorker() {
	// check the status of the SW
	if ('serviceWorker' in navigator) {
		if (navigator.serviceWorker.controller) {
			$('#loadingStatus').text('supports offline cache');

			// as soon as the SW is ready, ask it to update
			navigator.serviceWorker.ready.then(function(registration) {
				$('#workerStatus').text('updating offline cache');
				registration.update().then(function() {
					$('#workerStatus').text('offline cache updated');
				}).catch(function (e) {
					$('#workerStatus').text('update failed', e);
				})

				$('#workerStatus').text('waiting for offline cache');
			});
		} else {
			$('#workerStatus').text('trouble with offline cache');
		}
	} else {
		$('#workerStatus').text('no offline cache');
	}	
}

// REDIRECT to HTTPS!
var host = "wfwalker.github.io";
if ((host == window.location.host) && (window.location.protocol != "https:")) {
	window.location.protocol = "https";
} else {
	updateServiceWorker();

	$(document).ready(function() {
		if (window.AudioContext||window.webkitAudioContext) {
			// load all the sounds first
			loadAllSounds();
		} else {
			$('#missingWebAudioModal').modal('show');
			console.log('No Web Audio API');
		}

		// TODO: graceful exit if Web Audio API is absent

		// halt button stops playing all sounds
		$('#halt').click(function (e) {
			stopPlayingAllSounds();
		});

		// rate button changes playback rate
		$('#rate').click(function (e) {
			for (url in gSoundSources) {
				var theInput = $('input[value="' + url + '"]');
				var rates = (theInput.data('rates')+"").split(',').map(function(str) { return parseFloat(str); });
				var randomRate = rates[Math.floor(Math.random() * rates.length)];

				if (gSoundSources[url]) {
					gSoundSources[url].playbackRate.linearRampToValueAtTime(randomRate, gAudioContext.currentTime);
					console.log(url, rates, randomRate);
				} else {
					console.log(url, 'not playing');
				}
			}
		});

		// reverse button plays sounds backward
		$('#reverse').click(function (e) {
			for (url in gSoundSources) {
				var theInput = $('input[value="' + url + '"]');
				console.log(url, theInput);
			}
		});

		// respond to a checkbox event either by starting or stopping sound
		$(document).on('change', 'input:checkbox', function (e) {
			$(this).toggleClass('checked');

			if ($(this).hasClass('checked')) {
				if ($(this).data('exclusive')) {
					console.log('exclusive, stop playing other sounds');
					stopPlayingAllOtherSounds($(this));
				} else {
					console.log('not exclusive, do not stop other sounds');
				}
				console.log('CHECKED', $(this));
				startPlayingSound($(this));
			} else {
				console.log('UNCHECKED', $(this));
				stopPlayingSound($(this));
			}
		});
	});
}

