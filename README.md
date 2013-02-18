jquery-mask-input
=================

**A jQuery plugin for applying a mask to an input (e.g., phone numbers, dates, et cetera).**

jQuery Mask Input is licensed under the MIT license. Attribution is appreciated, though not required. 

######Features I'd like to implement
* Callback when input validity changes state. 
* Input class toggling when input validity changes state.

## Demo
http://plnkr.co/edit/qKCgHmJqOg7iXczmup5i?p=preview


## Usage

	.maskInput(mask. [callback]);

-
	
### SIMPLE MASK

There are two types of masks you can pass to maskInput. The first is a simple string containing special mask characters. By default, these characters are as follows:

    9: Any digit character
    A: Any letter character
    *: Any letter or digit character
    
Below is an example of a phone number mask.

	<input id="phone" type="text" name="phone">
	
	<script type="text/javascript">
		$('#phone').maskInput('(999) 999-9999');
	</script>

Alternatively, a mask can be specified in the ``mask`` attribute of the input element.

	<input id="phone" type="text" name="phone" mask="(999) 999-9999">
	
	<script type="text/javascript">
		$('#phone').maskInput();
	</script>

After the mask is applied, the ``placeholder`` attribute will be set to ``(___) ___-___``.


### COMPLEX MASK

If the simple character mask isn't enough, you can specify your own complex mask. For example, if you wanted someone to enter their date of birth, you can be a little more restrictive about what characters you want to allow in specific parts of the mask. Take this example:

	MM: __ DD: __ YYYY: ____

We could restrict the first M digit to be either a 0 or a 1. And the first D digit could be restricted to being 0-3. And the two YY digits could either be 1 or 2 and 9 or 0, respectively. This is what the mask argument would look like; an array of strings and RegEx patterns.

	["MM: ", /[01]/, /\d/, " DD: ", /[0-3]/, /\d/, " YYYY: ", /[12]/, /[90]/, /\d/, /\d/];

Please note that the RegEx portions of the array can only apply to 1 character each. Putting it all together, it looks like this:

	<input id="birthdate" type="text" name="birthdate">
	
	<script type="text/javascript">
		$('#birthdate').maskInput(["MM: ", /[01]/, /\d/, " DD: ", /[0-3]/, /\d/, " YYYY: ", /[12]/, /[90]/, /\d/, /\d/]);
	</script>


The unmasked value is set as the value of the "value-unmasked" attribute of the input. Validity of the current value can be accessed by using ``$('input').data('isUnmaskedValueValid')``, which returns ``true`` or ``false``.


### CALLBACK

If provided, the callback will be called and the following object will be passed as an argument:

	{
		isValid: boolean,
		value: 'value without mask',
		maskedValue: 'value with mask'
	}
	