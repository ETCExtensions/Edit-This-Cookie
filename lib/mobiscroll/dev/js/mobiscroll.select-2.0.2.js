(function ($) {

    var defaults = {
        inputClass: '',
        invalid: []
    }

    $.scroller.presets.select = function (inst) {
        var s = $.extend({}, defaults, inst.settings),
            elm = $(this),
            id = this.id + '_dummy',
            l1 = $('label[for="' + this.id + '"]').attr('for', id),
            l2 = $('label[for="' + id + '"]'),
            label = s.label !== undefined ? s.label : (l2.length ? l2.text() : elm.attr('name')),
            invalid = [],
            w = [{}];

        w[0][label] = {};

        var main = w[0][label];

        $('option', elm).each(function () {
            var v = $(this).attr('value');
            main['_' + v] = $(this).text();
            if ($(this).prop('disabled')) invalid.push(v);
        });

        if (!s.invalid.length)
            s.invalid = invalid;

        $('#' + id).remove();

        var input = $('<input type="text" id="' + id + '" value="' + main['_' + elm.val()] + '" class="' + s.inputClass + '" readonly />').insertBefore(elm);

        if (s.showOnFocus)
            input.focus(function () { inst.show() });

        elm.bind('change', function () {
            if (('_' + $(this).val()) !== inst.values[0]) {
                inst.setSelectVal([$(this).val()], true);
            }
        }).hide().closest('.ui-field-contain').trigger('create');

        inst.setSelectVal = function (d, fill, time) {
            inst.temp = ['_' + d[0]];
            inst.setValue(true, fill, time);
            // Set input/select values
            if (fill) {
                input.val(main['_' + d[0]]);
                var changed = d[0] !== elm.val();
                elm.val(d[0]);
                // Trigger change on element
                if (changed)
                    elm.trigger('change');
            }
        }

        inst.getSelectVal = function (temp) {
            var val = temp ? inst.temp : inst.values;
            return val[0].replace(/_/, '');
        }

        return {
            width: 200,
            wheels: w,
            headerText: false,
            formatResult: function (d) {
                return main[d[0]];
            },
            parseValue: function () {
                return ['_' + elm.val()];
            },
            validate: function (dw) {
                $.each(s.invalid, function (i, v) {
                    $('li[data-val="_' + v + '"]', dw).removeClass('dw-v');
                });
            },
            onSelect: function (v, inst) {
                input.val(v);
                elm.val(inst.values[0].replace(/_/, '')).trigger('change');
            },
            onChange: function (v, inst) {
                if (s.display == 'inline') {
                    input.val(v);
                    elm.val(inst.temp[0].replace(/_/, '')).trigger('change');
                }
            },
            onClose: function () {
                input.blur();
            },
            methods: {
                setValue: function (d, fill, time) {
                    return this.each(function () {
                        var inst = $(this).scroller('getInst');
                        if (inst) {
                            if (inst.setSelectVal) {
                                inst.setSelectVal(d, fill, time);
                            }
                            else {
                                inst.temp = d;
                                inst.setValue(true, fill, time);
                            }
                        }
                    });
                },
                getValue: function (temp) {
                    var inst = $(this).scroller('getInst');
                    if (inst)
                        if (inst.getSelectVal) {
                            return inst.getSelectVal(temp);
                        }
                        else {
                            return inst.values;
                        }
                }
            }
        }
    }

})(jQuery);
