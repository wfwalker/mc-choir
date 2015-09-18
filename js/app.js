// app.js

var gAudioContext = new AudioContext();
var gSoundSource = null;

setBufferFromURL = function(inSoundDataURL) {
	console.log('setBufferFromURL ' + inSoundDataURL);

	var mp3Request = new XMLHttpRequest();

	mp3Request.onerror = function(e) {
		console.log('error downloading');
	}.bind(this);

	mp3Request.onprogress = function(e) {
		console.log(Math.round(100 * e.loaded / e.total) + '%');
	}.bind(this);

	mp3Request.onload = function(e) {
		    gAudioContext.decodeAudioData(mp3Request.response, function(decodedBuffer) {

			gSoundSource = gAudioContext.createBufferSource();
			gSoundSource.connect(gAudioContext.destination);
			gSoundSource.buffer = decodedBuffer;

			// start playing immediately in a loop
			gSoundSource.loop = true;
			gSoundSource.start(0);
		}.bind(this));
	}.bind(this);

	mp3Request.open("GET", inSoundDataURL, true);
	mp3Request.responseType = 'arraybuffer';
	mp3Request.send();
}

$(document).ready(function() {
	$('button').click(function (e) {
		e.preventDefault();

		$(this).toggleClass('checked');

		if ($(this).hasClass('checked')) {
			console.log('START',
				$(this).parent().parent().find('.btn-group label.active input')[0].id
			);

			setBufferFromURL("./saw440.mp3");
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