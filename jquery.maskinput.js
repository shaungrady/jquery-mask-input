/*
 Mask Input plugin for jQuery
 Licensed under the MIT license (https://github.com/shaungrady/jquery-mask-input/blob/master/LICENSE)
 Version: 1.5
 */
(function ($, window, document, undefined) {
    var maskDefinitions = {
        '9': /\d/,
        'A': /[a-zA-Z]/,
        '*': /[a-zA-Z0-9]/
    };

    // Plugin
    $.fn.extend({
        maskInput: function(maskOption, callbackBeforeInput, callbackAfterInput ) {
            if (!this.length) return this;
            callbackAfterInput = callbackAfterInput || $.noop;
            callbackBeforeInput = callbackBeforeInput || $.noop;

            return this.filter('input').each(function(i, el) {
                var elem = $(el),
                    mask = elem.attr('mask') || maskOption,
                    // An array of valid non-mask character positions. Used extensively for detecting invalid
                    // caret positions and moving it to an appropriate position.
                    maskMap = [],
                    // Array of single-character regex patterns used for filtering mask from input value to
                    // produce the unmasked value.
                    maskPattern = [],
                    // Used for placeholder attribute of input as well as maskifying the unmasked value for
                    // placement back into the input in the event listener.
                    maskPlaceholder = '',
                    chrCount = 0;

                if (mask === undefined)
                    return true;

                // If mask is an array, it's a complex mask!
                if (mask instanceof Array) {
                    $.each(mask, function(i, item) {
                        if (item instanceof RegExp) {
                            maskMap.push(chrCount++);
                            maskPlaceholder += '_';
                            maskPattern.push(item);
                        }
                        else if (typeof item == 'string') {
                            $.each(item.split(''), function(i, chr) {
                                maskPlaceholder += chr;
                                chrCount++;
                            });
                        }
                    });
                }
                // Otherwise it's a simple mask
                else {
                    $.each(mask.split(''), function(i, chr) {
                        if (maskDefinitions[chr]) {
                            maskMap.push(chrCount);
                            maskPlaceholder += '_';
                            maskPattern.push(maskDefinitions[chr]);
                        }
                        else
                            maskPlaceholder += chr;
                        chrCount++;
                    });
                }

                // No non-mask characters found
                if (!maskMap.length)
                    return this;
                // index after last non-mask character is allowed
                maskMap.push(chrCount);

                // Intialize input
                (function(elem) {
                    var valUnmasked = unmaskValue(elem.val()),
                        valMasked   = maskValue(valUnmasked),
                        isValid     = (valUnmasked.length === (maskMap.length - 1)),
                        maxlength   = elem.attr('maxlength');
                    elem.val(valMasked);
                    elem.attr('value-unmasked', valUnmasked);
                    elem.data('isUnmaskedValueValid', isValid);
                    // maxlength prevents typing as input is always filled to length of mask.
                    if (maxlength) elem.attr('maxlength', (parseInt(maxlength, 10) + 1));
                })(elem);

                elem.attr('placeholder', maskPlaceholder);
                elem.unbind('.mask');
                elem.bind('blur.mask', blurHandler).triggerHandler('blur');
                elem.bind('input propertychange.mask keyup.mask focus.mask', eventHandler);

                function isValidCaretPos(pos) { return $.inArray(pos, maskMap) > -1; }

                function unmaskValue(val) {
                    var unmaskedValue   = '',
                        maskPatternCopy = maskPattern.slice();
                    $.each(val.split(''), function(i, chr) {
                        if (maskPatternCopy.length && maskPatternCopy[0].test(chr)) {
                            unmaskedValue += chr;
                            maskPatternCopy.shift();
                        }
                    });
                    return unmaskedValue;
                }

                function maskValue(valUnmasked) {
                    var valMasked   = '',
                        maskMapCopy = maskMap.slice();
                    $.each(maskPlaceholder.split(''), function(i, chr) {
                        if (valUnmasked.length && i === maskMapCopy[0]) {
                            valMasked  += valUnmasked.charAt(0) || '_';
                            valUnmasked = valUnmasked.substr(1);
                            maskMapCopy.shift();
                        }
                        else
                            valMasked += chr;
                    });
                    return valMasked;
                }

                function blurHandler(e) {
                    var elem = $(this);
                    if (!elem.data('isUnmaskedValueValid')) {
                        elem.val('');
                        elem.attr('value-unmasked', '');
                    }
                    elem.data('caretPositionPreinput', 0);
                    elem.data('selectionLengthPreinput', 0);
                }

                function eventHandler(e) {
                    // Allows more efficient minification
                    var eventWhich = e.which,
                        eventType  = e.type;


                    // Shift and ctrl aren't going to ruin our party.
                    if (eventWhich == 16 || eventWhich == 91) return true;

                    var elem            = $(this),
                        val             = elem.val(),
                        valOld          = elem.data('valuePreinput')  || '',
                        valMasked,
                        valUnmasked     = unmaskValue(val),
                        valUnmaskedOld  = elem.attr('value-unmasked') || '',

                        isValid         = false,

                        caretPos        = getCaretPositionIn(this) || 0,
                        caretPosOld     = elem.data('caretPositionPreinput') || 0,
                        caretPosDelta   = caretPos - caretPosOld,
                        caretPosMin     = maskMap[0],
                        caretPosMax     = maskMap[valUnmasked.length] || (maskMap.slice().pop() + 1),

                        selectionLen    = selectionLengthOf(this),
                        selectionLenOld = elem.data('selectionLengthPreinput') || 0,
                        isSelected      = selectionLen > 0,
                        wasSelected     = selectionLenOld > 0,

                        // Case: Typing a character to overwrite a selection
                        isAddition      = (val.length > valOld.length) || (selectionLenOld && val.length >  valOld.length - selectionLenOld),
                        // Case: Delete and backspace behave identically on a selection
                        isDeletion      = (val.length < valOld.length) || (selectionLenOld && val.length == valOld.length - selectionLenOld),
                        isSelection     = (eventWhich >= 37 && eventWhich <= 40) && e.shiftKey, // Arrow key codes

                        isKeyLeftArrow  = eventWhich == 37,
                        // Necessary due to "input" event not providing a key code
                        isKeyBackspace  = eventWhich == 8  || (eventType != 'keyup' && isDeletion && (caretPosDelta === -1)),
                        isKeyDelete     = eventWhich == 46 || (eventType != 'keyup' && isDeletion && (caretPosDelta === 0 ) && !wasSelected),

                        // Handles cases where caret is moved and placed in front of invalid maskMap position. Logic below
                        // ensures that, on click or leftward caret placement, caret is moved leftward until directly right of
                        // non-mask character. Also applied to click since users are (arguably) more likely to backspace
                        // a character when clicking within a filled input.
                        caretBumpBack   = (isKeyLeftArrow || isKeyBackspace || eventType == 'click') && caretPos > caretPosMin;
                    if (callbackBeforeInput({
                            value: unmaskValue(val),
                            maskedValue: val,
                            lastChar: unmaskValue(val).substring(unmaskValue(val).length-1,unmaskValue(val).length),
                            inputElement: elem
                        })==false) {
                        elem.val(maskValue(valUnmaskedOld));
                        return true;
                    }


                    elem.data('selectionLengthPreinput', selectionLen);

                    // Track mouseout for cases where user drags selection outside input bounds.
                    elem.unbind('mouseout.mask').one('mouseout.mask', eventHandler);

                    // These events don't require any action
                    if (eventType == 'mouseout' || isSelection || (isSelected && (eventType == 'click' || eventType == 'keyup')))
                        return true;

                    // Value Handling
                    // ==============

                    // User attempted to delete but raw value was unaffected--correct this grievous offense
                    if ((eventType == 'input' || eventType == 'propertychange') && isDeletion && !wasSelected && valUnmasked === valUnmaskedOld) {
                        while (isKeyBackspace && caretPos > 0 && !isValidCaretPos(caretPos))
                            caretPos--;
                        while (isKeyDelete && caretPos < maskPlaceholder.length && $.inArray(caretPos, maskMap) == -1)
                            caretPos++;
                        var charIndex = $.inArray(caretPos, maskMap);
                        // Strip out character that user inteded to delete if mask hadn't been in the way.
                        valUnmasked = valUnmasked.substring(0, charIndex) + valUnmasked.substring(charIndex + 1);
                    }

                    isValid = valUnmasked.length === (maskMap.length - 1);

                    elem.attr('value-unmasked', valUnmasked);
                    elem.data('isUnmaskedValueValid', isValid);

                    valMasked = maskValue(valUnmasked);
                    elem.data('valuePreinput', valMasked);
                    elem.val(valMasked);

                    // Caret Repositioning
                    // ===================

                    // Ensure that typing always places caret ahead of typed character
                    if (isAddition && (caretPos <= caretPosMin))
                        caretPos = caretPosMin + 1;

                    if (caretBumpBack)
                        caretPos--;

                    // Make sure caret is within min and max positions
                    caretPos = caretPos > caretPosMax ? caretPosMax : caretPos < caretPosMin ? caretPosMin : caretPos;

                    // Scoot the caret around until it's in a valid position and within min/max limits
                    while (!isValidCaretPos(caretPos) && caretPos > caretPosMin && caretPos < caretPosMax)
                        caretPos += caretBumpBack ? -1 : 1;

                    if ((caretBumpBack && caretPos < caretPosMax) || (isAddition && !isValidCaretPos(caretPosOld)))
                        caretPos++;

                    elem.data('caretPositionPreinput', caretPos);
                    setCaretPositionIn(this, caretPos);

                    // Callback only on keyup - this allows the input event to record backspaces but prevents launching the callback twice
                    if (e.type != 'input') {
                        callbackAfterInput({
                            isValid: isValid,
                            value: valUnmasked,
                            maskedValue: valMasked,
                            inputElement: elem
                        });
                    }
                }
            });
        }
    });

    // Helper functions
    // ================

    function getCaretPositionIn(input) {
        if (input.selectionStart !== undefined)
            return input.selectionStart;
        else if (document.selection) {
            // Curse you IE
            input.focus();
            var selection = document.selection.createRange();
            selection.moveStart('character', -input.value.length);
            return selection.text.length;
        }
    }

    function setCaretPositionIn(input, pos) {
        if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(pos,pos); }
        else if (input.createTextRange) {
            // Curse you IE
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }

    function selectionLengthOf(input) {
        if (input.selectionStart !== undefined)
            return (input.selectionEnd - input.selectionStart);
        if (document.selection)
            return (document.selection.createRange().text.length);
    }
})(jQuery, window, document);
