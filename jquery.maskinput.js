/*
  Mask Input plugin for jQuery
  Copyright (c) 2013 Josh Bush (shaungrady.com)
  Licensed under the MIT license (https://github.com/shaungrady/jquery-mask-input/blob/master/LICENSE)
  Version: 1.0
*/
(function ($, window, document, undefined) {
  var maskDefinitions = {
    '9': /\d/,
    'A': /[a-zA-Z]/,
    '*': /[a-zA-Z0-9]/
  };
  // Plugin
  $.fn.extend({
    maskInput: function(maskOption) {
      if (!this.length) return this;
      return this.filter('input').each(function(i, el) {
        var elem = $(el),
            mask = elem.attr('mask') || maskOption,
            maskMap = [],
            maskPattern = [],
            maskPlaceholder = '';

        if (mask === undefined)
          return true;

        $.each(mask.split(''), function(i, chr) {
          if (maskDefinitions[chr]) {
            maskMap.push(i);
            maskPlaceholder += '_';
            maskPattern.push(maskDefinitions[chr]);
          }
          else
            maskPlaceholder += chr;
        });
        if (!maskMap.length) return this;

        // Intialize input
        (function(elem) {
          var val         = elem.val(),
              valMasked   = maskValue(val),
              valUnmasked = unmaskValue(valMasked),
              isValid     = (valUnmasked.length === maskMap.length);
          elem.val(valMasked);
          elem.removeAttr('maxlength');
          elem.attr('value-unmasked', valUnmasked);
          elem.data('isUnmaskedValueValid', isValid);
        })(elem);

        elem.attr('placeholder', maskPlaceholder);
        elem.unbind('.mask');
        elem.bind('blur.mask', blurHandler).triggerHandler('blur');
        elem.bind('input.mask propertychange.mask keyup.mask click.mask', eventHandler);

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

        function maskValue(valUnmasked){
          var valMasked        = '',
              valUnmaskedIndex = 0;
          $.each(mask.split(''), function(i, chr) {
            if (maskDefinitions[chr])
              valMasked += valUnmasked.charAt(valUnmaskedIndex++) || '_';
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
          var eventWhich = e.which,
              eventType  = e.type,
              inArray    = $.inArray;

          // Shift, alt, and tab aren't going to ruin our party.
          if (eventWhich == 16 || eventWhich == 91 || eventWhich == 9) return true;

          var elem            = $(this),
              val             = elem.val(),
              valOld          = elem.data('valuePreinput')  || '',
              valUnmasked     = unmaskValue(val),
              valUnmaskedOld  = elem.attr('value-unmasked') || '',

              caretPos        = caretPositionOf(this) || 0,
              caretPosOld     = elem.data('caretPositionPreinput') || 0,
              caretPosDelta   = caretPos - caretPosOld,
              caretPosMin     = maskMap[0],
              caretPosMax     = maskMap[valUnmasked.length],

              selectionLen    = selectionLengthOf(this),
              selectionLenOld = elem.data('selectionLengthPreinput') || 0,
              isSelected      = selectionLen > 0,
              wasSelected     = selectionLenOld > 0,

              isAddition      = (val.length > valOld.length) || (selectionLenOld && val.length >  valOld.length - selectionLenOld),
              isDeletion      = (val.length < valOld.length) || (selectionLenOld && val.length == valOld.length - selectionLenOld),
              isSelection     = (eventWhich >= 37 && eventWhich <= 40) && e.shiftKey,

              isKeyLeftArrow  = eventWhich == 37,
              isKeyBackspace  = eventWhich == 8  || (eventType != 'keyup' && isDeletion && (caretPosDelta === -1)),
              isKeyDelete     = eventWhich == 46 || (eventType != 'keyup' && isDeletion && (caretPosDelta === 0 ) && !wasSelected),

              caretBumpBack   = (isKeyLeftArrow || isKeyBackspace || eventType == 'click') && caretPos > 0;

          elem.data('selectionLengthPreinput', selectionLen);

          // Track mouseout for cases where user drags selection outside input bounds.
          elem.unbind('mouseout.mask').one('mouseout.mask', eventHandler);

          // These events don't require any action
          if (eventType == 'mouseout' || isSelection || (isSelected && eventType == 'click'))
            return true;

          // User attempted to delete but raw value was unaffected—correct this grievous offense
          if (eventType == 'input' && isDeletion && !wasSelected && valUnmasked === valUnmaskedOld) {
            while (isKeyBackspace && caretPos > 0 && inArray(caretPos, maskMap) == -1)
              caretPos--;
            while (isKeyDelete && caretPos < maskPlaceholder.length && inArray(caretPos, maskMap) == -1)
              caretPos++;
            var charIndex = inArray(caretPos, maskMap);
            valUnmasked = valUnmasked.substring(0, charIndex) + valUnmasked.substring(charIndex + 1); 
          }
          elem.attr('value-unmasked', valUnmasked);
          elem.data('isUnmaskedValueValid', (valUnmasked.length === maskMap.length));
          
          var valMasked = maskValue(valUnmasked);
          elem.data('valuePreinput', valMasked);
          elem.val(valMasked);

          // Caret Repositioning

          // Make sure caret ends up after typed character.
          if (caretPos <= caretPosMin && isAddition)
            caretPos = caretPosMin + 1;

          // Caret isn't allowed beyond first non-mask character
          caretPos = caretPos > caretPosMax ? caretPosMax : caretPos;

          if (caretBumpBack)
            caretPos--;
          while (inArray(caretPos, maskMap) === -1) {
            if (caretBumpBack)
              caretPos--;
            else
              caretPos++;
            if (caretPos < maskMap[0]) {
              caretPos = maskMap[0];
              caretBumpBack = false;
              break;
            }
            else if (caretPos >= mask.length){
              caretPos = maskMap[maskMap.length - 1] + 1;
              caretBumpBack = false;
              break;
            }
          }
          if (caretBumpBack || (isAddition && inArray(caretPosOld, maskMap) === -1))
            caretPos++;

          elem.data('caretPositionPreinput', caretPos);
          caretPositionOf(this, caretPos);
        }
      });
    }
  });
  // Helper functions
  function caretPositionOf(input, pos) {
    // Set position
    if (pos !== undefined) {
      if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(pos,pos);
      }
      else if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
      }
    }
    // Get position
    else {
      var caretPosition = 0;
      if (document.selection) {
        input.focus();
        var selection = document.selection.createRange();
        selection.moveStart('character', -input.value.length);
        caretPosition = selection.text.length;
      }
      if (input.selectionStart !== undefined)
        caretPosition = input.selectionStart;
      return (caretPosition);
    }
  }
  function selectionLengthOf(input) {
    if (input.selectionStart !== undefined)
      return (input.selectionEnd - input.selectionStart);
    if (document.selection)
      return (document.selection.createRange().text.length);
  }
})(jQuery, window, document);