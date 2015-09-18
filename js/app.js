// app.js

var gAudioContext = new AudioContext();
var gOscillator = null;

$(document).ready(function() {
	$('button').click(function (e) {
		e.preventDefault();

		$(this).toggleClass('checked');

		console.log('clicked play',
			$(this).parent().parent().find('.btn-group label.active input')[0].id,
			e.target.id,
			$(this).hasClass('checked')
		);

		if ($(this).hasClass('checked')) {
			gOscillator = gAudioContext.createOscillator();
			gOscillator.frequency.value = 200;
			gOscillator.connect(gAudioContext.destination);
			gOscillator.start(0);	
		} else {
			gOscillator.stop(0);
		}

	});

	$(document).on('change', 'input:radio', function (e) {
		e.preventDefault();
		console.log('clicked selector', e.target.id);
	});
});