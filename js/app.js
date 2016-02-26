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
      reject(Error('Network Error'));
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
		$('.progress-bar').css('width', Math.floor(100 * gSoundProgress / gSoundTotal) + '%');
		console.time('decode' + inSoundDataURL);
		$('#loadingStatus').text('DECODE ' + inSoundDataURL);
	    return decodeAudioDataAsync(response);
	}).then(function(decodedBuffer) {
		console.timeEnd('decode' + inSoundDataURL);
		gSounds[inSoundDataURL] = decodedBuffer;

		gSoundProgress++;
		$('.progress-bar').css('width', Math.floor(100 * gSoundProgress / gSoundTotal) + '%');

		$('#loadingStatus').text('REVERSE ' + inSoundDataURL);
		gReversedSounds[inSoundDataURL] = createReverseBuffer(decodedBuffer);

		gSoundProgress++;
		$('#loadingStatus').text('DONE ' + inSoundDataURL);
		$('.progress-bar').css('width', Math.floor(100 * gSoundProgress / gSoundTotal) + '%');
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

// Start playing a sound for an input field that looks like this:

// <input data-key='1' type="checkbox" name="sounds"
//       value='./Vla1-HarmonicsX.mp3' data-exclusive='false'
//       data-rates='1.0, 2.0, 0.5, 1.5, 0.66667, 1.3333, 0.75' autocomplete="off">

function startPlayingSound(activeInput, chooseNewRate, chooseRandomDirection) {
	console.log('startPlayingSound', chooseNewRate, chooseRandomDirection);

	var soundURL = activeInput.attr('value');
	var rates = (activeInput.data('rates')+'').split(',').map(function(str) { return parseFloat(str); });

	// retrieve the old rate
	var randomRate = activeInput.attr('data-rate');

	// if requested, choose a new rate
	if (chooseNewRate) {
		randomRate = rates[Math.floor(Math.random() * rates.length)];
		activeInput.attr('data-rate', randomRate);
	}

	if (gSounds[soundURL]) {
		ga('send', {
			hitType: 'event',
			eventCategory: 'Sounds',
			eventAction: 'play',
			eventLabel: soundURL,
		});

		// start playing immediately in a loop
		var newSoundSource = gAudioContext.createBufferSource();
		newSoundSource.connect(gAudioContext.destination);

		// either choose playback direction randomly,
		// 	or opposite to current direction

		var newDirection = Math.random() > 0.5;

		if (chooseRandomDirection) {
			console.log('yes random direction, we picked', newDirection);
		} else {
			console.log('reverse existing direction');
			if (activeInput.attr('data-forward')) {
				newDirection = (activeInput.attr('data-forward') == 'false');
			} else {
				console.log('missing direction attribute!');
			}
		}

		// play forwards or backwards, at random
		if (newDirection) {
			activeInput.attr('data-forward', true);
			newSoundSource.buffer = gSounds[soundURL];
		} else {
			activeInput.attr('data-forward', false);
			newSoundSource.buffer = gReversedSounds[soundURL];
		}

		// compute random offset
		var offset = Math.random() * newSoundSource.buffer.duration;
		console.log('duration', newSoundSource.buffer.duration, 'offset', offset, 'forward', activeInput.attr('data-forward'));

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

function stopPlayingSound(activeInput) {
	var soundURL = activeInput.attr('value');

	if (gSoundSources[soundURL]) {
		gSoundSources[soundURL].stop(0);
		gSoundSources[soundURL].disconnect();
		gSoundSources[soundURL] = null;
		$('#soundInfo').text('');
		console.log('STOPPED', soundURL);		

		ga('send', {
			hitType: 'event',
			eventCategory: 'Sounds',
			eventAction: 'stop',
			eventLabel: soundURL,
		});
	} else {
		// console.log('not playing, stop does nothing');
	}
}

function stopPlayingAllSounds() {
	$('label.checkbox-inline input').each(function (index) {
		stopPlayingSound($(this));
		$(this).removeClass('checked');
		$(this).parent().removeClass('checked');
		$(this).parent().parent().removeClass('checked');
		$(this).attr('checked', false);
	});
}

function stopPlayingAllOtherSounds(activeInput) {
	$('label.checkbox-inline input').each(function (index) {
		if ($(this).attr('value') == activeInput.attr('value')) {
			// console.log('skip stopping', activeInput.attr('value'));
		} else {
			// console.log('do not skip', activeInput.attr('value'), $(this).attr('value'))
			stopPlayingSound($(this));
			$(this).removeClass('checked');
			$(this).parent().removeClass('checked');
			$(this).parent().parent().removeClass('checked');
			$(this).attr('checked', false);
		}
	});
}

function handleKeypress(inKey) {
	// find something whose data-key attribute matches and click it
	$('[data-key="' + inKey+ '"]').click();
}

function handleRateButton(e) {
	for (url in gSoundSources) {
		var theInput = $('input[value="' + url + '"]');
		var rates = (theInput.data('rates')+'').split(',').map(function(str) { return parseFloat(str); });
		var randomRate = rates[Math.floor(Math.random() * rates.length)];

		if (gSoundSources[url]) {
			gSoundSources[url].playbackRate.linearRampToValueAtTime(randomRate, gAudioContext.currentTime);
			console.log(url, rates, randomRate);
			theInput.attr('data-rate', randomRate);
			$('#soundInfo').text(url + ', ' + rates + ' -> ' + randomRate);
			ga('send', {
				hitType: 'event',
				eventCategory: 'Sounds',
				eventAction: 'rate',
				eventLabel: url,
			});
		} else {
			console.log(url, 'not playing');
		}
	}
}

// REDIRECT to HTTPS!
var host = 'wfwalker.github.io';
if ((host == window.location.host) && (window.location.protocol != 'https:')) {
	window.location.protocol = 'https';
} else {
	$(document).ready(function() {
		// TODO: graceful exit if Web Audio API is absent
		if (window.AudioContext||window.webkitAudioContext) {
			// load all the sounds first
			loadAllSounds();
		} else {
			$('#missingWebAudioModal').modal('show');
			console.log('No Web Audio API');
		}

		$('body').keypress(function (e) {
			e.preventDefault();
			handleKeypress(String.fromCharCode(e.charCode));
		});

		// halt button stops playing all sounds
		$('#halt').click(function (e) {
			stopPlayingAllSounds();
		});

		// rate button changes playback rate
		$('#rate').click(handleRateButton);

		// reverse button plays sounds backward, maybe
		$('#reverse').click(function (e) {
			for (url in gSoundSources) {
				if (gSoundSources[url]) {
					var theInput = $('input[value="' + url + '"]');
					stopPlayingSound(theInput);
					startPlayingSound(theInput, false, false);
					ga('send', {
						hitType: 'event',
						eventCategory: 'Sounds',
						eventAction: 'reverse',
						eventLabel: url,
					});
				} else {
					console.log(url, 'not playing');
				}
			}
		});

		// respond to a checkbox event either by starting or stopping sound
		$(document).on('change', 'input:checkbox', function (e) {
			$(this).toggleClass('checked');
			$(this).parent().toggleClass('checked');
			$(this).parent().parent().toggleClass('checked');

			if ($(this).hasClass('checked')) {
				if ($(this).data('exclusive')) {
					console.log('exclusive, stop playing other sounds');
					stopPlayingAllOtherSounds($(this));
				} else {
					console.log('not exclusive, do not stop other sounds');
				}
				console.log('CHECKED', $(this));
				startPlayingSound($(this), true, true);
			} else {
				console.log('UNCHECKED', $(this));
				stopPlayingSound($(this));
			}
		});
	});
}

// use fastclick
$(function() {
	FastClick.attach(document.body);
});


