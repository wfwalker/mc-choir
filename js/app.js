// app.js

$(document).ready(function() {
	$('button').click(function (e) {
		e.preventDefault();
		console.log('clicked play', e.target.getAttribute('id'));
	})

	$(document).on('change', 'input:radio', function (e) {
		e.preventDefault();
		console.log('clicked selector', e.target.id);
	})
});