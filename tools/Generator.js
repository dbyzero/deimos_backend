
var Generator = new Object();

Generator.generateName = function() {
	var tones = ['a', 'e', 'i', 'o', 'u', 'y', 'ay', 'oi', 'oo', 'ee', 'en', 'an', 'ou'];
	var forms = [
		'q', 'w', 'r', 't', 'p', 's', 'd', 'f', 'g', 'h', 'k', 'j', 'l',
		'z', 'x', 'c', 'v', 'b', 'n', 'm', 'th', 'wh', 'ch', 'sh'
	];
	var toneLength = tones.length;
	var formLength = forms.length;

	var length = parseInt(Math.random()*4+2);
	var formTurn = true;

	var name = "";
	var i = 0 ;
	while(i++ < length) {
		if(formTurn) {
			var idx = parseInt(Math.random() * formLength);
			name += forms[idx];
		} else {
			var idx = parseInt(Math.random() * toneLength);
			name += tones[idx];
		}
		formTurn = !formTurn;
	}

	var nameSplitted = name.split('');
	nameSplitted[0] = nameSplitted[0].toUpperCase();
	name = nameSplitted.join('');
	return name;
};

module.exports = Generator;