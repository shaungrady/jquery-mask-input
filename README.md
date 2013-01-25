jquery-mask-input
=================

A jQuery plugin for applying a mask to an input (e.g., phone numbers, dates, et cetera).

jQuery Input Mask is licensed under the MIT license.

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