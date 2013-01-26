jquery-mask-input
=================

**A jQuery plugin for applying a mask to an input (e.g., phone numbers, dates, et cetera).**

jQuery Mask Input is licensed under the MIT license. Attribution is appreciated, though not required. 

######Features I'd like to implement
* Callback when input validity changes state. 
* Input class toggling when input validity changes state.  
* Mask definitions are too restrictive in some cases. Add a way of passing in a more detailed mask (e.g., a mask for MM/DD/YYYY where the first M can only be 0-1, the first D can only be 0-3, and the first Y can only be 1-2).

## Demo
http://plnkr.co/edit/qKCgHmJqOg7iXczmup5i?p=preview


## Usage
	.maskInput([mask]);

Pass mask as argument:

	<input type="text">
	
	<script type="text/javascript">
		$('input').maskInput('(999) 999-9999');
	</script>
	
Use mask attribute of input:

	<input type="text" mask="(999) 999-9999">
	
	<script type="text/javascript">
		$('input').maskInput();
	</script>
	
The following are the default mask definitions and their regex equivalents:

    '9': /\d/
    'A': /[a-zA-Z]/
    '*': /[a-zA-Z0-9]/

The unmasked value is set as the value of the "value-unmasked" attribute of the input. Validity of the current value can be accessed by using ``$('input').data('isUnmaskedValueValid')``, which returns ``true`` or ``false``.
