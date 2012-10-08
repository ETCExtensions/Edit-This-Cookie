/*!
 * jQuery MobiScroll v2.0.2
 * http://mobiscroll.com
 *
 * Copyright 2010-2011, Acid Media
 * Licensed under the MIT license.
 *
 */
(function ($) {

    function Scroller(elm, settings) {
        var that = this,
            e = elm,
            elm = $(e),
            theme,
            s = $.extend({}, defaults),
            m,
            dw,
            iv = {},
            input = elm.is('input'),
            visible = false;

        // Private functions

        function getDocHeight() {
            var body = document.body,
                html = document.documentElement;
            return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        }

        function setGlobals(t) {
            min = $('li.dw-v', t).eq(0).index();
            max = $('li.dw-v', t).eq(-1).index();
            index = $('ul', dw).index(t);
            h = s.height;
            inst = that;
        }

        function formatHeader(v) {
            var t = s.headerText;
            return t ? (typeof(t) == 'function' ? t.call(e, v) : t.replace(/{value}/i, v)) : '';
        }

        function read() {
            that.temp = ((input && that.val !== null && that.val != elm.val()) || that.values === null) ? s.parseValue(elm.val() ? elm.val() : '', that) : that.values.slice(0);
            that.setValue(true);
        }

        function scrollToPos(time, orig, index, manual, dir) {
            // Call validation event
            s.validate.call(e, dw, index, time);

            // Set scrollers to position
            $('.dww ul', dw).each(function(i) {
                var t = $(this),
                    cell = $('li[data-val="' + that.temp[i] + '"]', t),
                    x = cell.index(),
                    v = scrollToValid(cell, x, i, dir),
                    sc = i == index || index === undefined;
                if (x != v || sc)
                    that.scroll($(this), v, sc ? time : 0.2, orig, i);
            });

            // Reformat value if validation changed something
            that.change(manual);
        }

        function scrollToValid(cell, val, i, dir) {
            // Process invalid cells
            if (!cell.hasClass('dw-v')) {
                var cell1 = cell,
                    cell2 = cell,
                    dist1 = 0,
                    dist2 = 0;
                while (cell1.prev().length && !cell1.hasClass('dw-v')) {
                    cell1 = cell1.prev();
                    dist1++;
                }
                while (cell2.next().length && !cell2.hasClass('dw-v')) {
                    cell2 = cell2.next();
                    dist2++;
                }
                // If we have direction (+/- or mouse wheel), the distance does not count
                if (((dist2 < dist1 && dist2 && !dir == 1) || !dist1 || !cell1.hasClass('dw-v') || dir == 1) && cell2.hasClass('dw-v')) {
                    cell = cell2;
                    val = val + dist2;
                }
                else {
                    cell = cell1;
                    val = val - dist1;
                }
                that.temp[i] = cell.attr('data-val');
            }
            return val;
        }

        function position() {
            var totalw = 0,
                minw = 0,
                ww = $(window).width(),
                wh = $(window).height(),
                st = $(window).scrollTop(),
                o = $('.dwo', dw),
                d = $('.dw', dw),
                w,
                h;
            $('.dwc', dw).each(function() {
                w = $(this).outerWidth(true);
                totalw += w;
                minw = (w > minw) ? w : minw;
            });
            w = totalw > ww ? minw : totalw;
            d.width(w);
            w = d.outerWidth();
            h = d.outerHeight();
//            d.css({ left: (ww - w) / 2, top: st + (wh - h) / 2 });
            o.height(0).height(getDocHeight());
        }

        function plus(t) {
            var p = +t.data('pos'),
                val = p + 1;
            calc(t, val > max ? min : val, 1);
        }

        function minus(t) {
            var p = +t.data('pos'),
                val = p - 1;
            calc(t, val < min ? max : val, 2);
        }

        // Public functions

        /**
        * Enables the scroller and the associated input.
        */
        that.enable = function() {
            s.disabled = false;
            if (input)
                elm.prop('disabled', false);
        }

        /**
        * Disables the scroller and the associated input.
        */
        that.disable = function() {
            s.disabled = true;
            if (input)
                elm.prop('disabled', true);
        }

        /**
        * Scrolls target to the specified position
        * @param {Object} t - Target wheel jQuery object.
        * @param {Number} val - Value.
        * @param {Number} [time] - Duration of the animation, optional.
        */
        that.scroll = function(t, val, time, orig, index) {
            var px = (m - val) * s.height;
            t.attr('style', (time ? (prefix + '-transition:all ' + time.toFixed(1) + 's ease-out;') : '') + (has3d ? (prefix + '-transform:translate3d(0,' + px + 'px,0);') : ('top:' + px + 'px;')));

            function getVal(t, b, c, d) {
                return c * Math.sin(t/d * (Math.PI/2)) + b;
            }

            if (time && orig !== undefined) {
                var i = 0;
                clearInterval(iv[index]);
                iv[index] = setInterval(function() {
                    i += 0.1;
                    t.data('pos', Math.round(getVal(i, orig, val - orig, time)));
                    if (i >= time) {
                        clearInterval(iv[index]);
                        t.data('pos', val).closest('.dwwl').removeClass('dwa');
                    }
                }, 100);
            }
            else
                t.data('pos', val);
        }

        /**
        * Gets the selected wheel values, formats it, and set the value of the scroller instance.
        * If input parameter is true, populates the associated input element.
        * @param {Boolean} [fill] - Also set the value of the associated input element. Default is true.
        */
        that.setValue = function (sc, fill, time) {
            var v = s.formatResult(that.temp);
            that.val = v;
            that.values = that.temp.slice(0);
            if (visible && sc) scrollToPos(time);
            if (fill && input) elm.val(v).trigger('change');
        }

        /**
        * Checks if the current selected values are valid together.
        * In case of date presets it checks the number of days in a month.
        * @param {Integer} i - Currently changed wheel index, -1 if initial validation.
        */
        that.validate = function(time, orig, i, dir) {
            scrollToPos(time, orig, i, true, dir);
        }

        /**
         *
         */
        that.change = function (manual) {
            var v = s.formatResult(that.temp);
            if (s.display == 'inline')
                that.setValue(false, manual);
            else
                $('.dwv', dw).html(formatHeader(v));
            if (manual)
                s.onChange.call(e, v, that);
        }

        /**
        * Hides the scroller instance.
        */
        that.hide = function () {
            // If onClose handler returns false, prevent hide
            if (s.onClose.call(e, that.val, that) === false) return false;
            // Re-enable temporary disabled fields
            $('.dwtd').prop('disabled', false).removeClass('dwtd');
            elm.blur();
            // Hide wheels and overlay
            if (dw)
                dw.remove();
            visible = false;
            // Stop positioning on window resize
            $(window).unbind('.dw');
        }

        /**
        * Shows the scroller instance.
        */
        that.show = function () {
            if (s.disabled || visible) return false;

            var hi = s.height,
                l;
                thi = s.rows * hi;

            // Parse value from input
            read();

            // Create wheels containers
            var html = '<div class="' + s.theme + ' ">' + (s.display == 'inline' ? '<div class="dw dwbg dwi"><div class="dwwr">' : '<div class="dwo"></div><div class="dw dwbg"><div class="dwwr">' + (s.headerText ? '<div class="dwv"></div>' : ''));
            for (var i = 0; i < s.wheels.length; i++) {
                html += '<div class="dwc' + (s.mode != 'scroller' ? ' dwpm' : ' dwsc') + (s.showLabel ? '' : ' dwhl') + '"><div class="dwwc dwrc"><table cellpadding="0" cellspacing="0"><tr>';
                // Create wheels
                l = 0;
                for (var label in s.wheels[i]) {
                    html += '<td><div class="dwwl dwrc dwwl' + l + '">' + (s.mode != 'scroller' ? '<div class="dwwb dwwbp" style="height:' + hi + 'px;line-height:' + hi + 'px;"><span>+</span></div><div class="dwwb dwwbm" style="height:' + hi + 'px;line-height:' + hi + 'px;"><span>&ndash;</span></div>' : '') + '<div class="dwl">' + label + '</div><div class="dww dwrc" style="height:' + thi + 'px;min-width:' + s.width + 'px;"><ul>';
                    // Create wheel values
                    for (var j in s.wheels[i][label]) {
                        html += '<li class="dw-v" data-val="' + j + '" style="height:' + hi + 'px;line-height:' + hi + 'px;">' + s.wheels[i][label][j] + '</li>';
                    }
                    html += '</ul><div class="dwwo"></div></div><div class="dwwol"></div></div></td>';
                    l++;
                }
                html += '</tr></table></div></div>';
            }
            html += (s.display != 'inline' ? '<div class="dwbc"><span class="dwbw dwb-s"><a href="#" class="dwb">' + s.setText + '</a></span><span class="dwbw dwb-c"><a href="#" class="dwb">' + s.cancelText + '</a></span></div>' : '<div class="dwcc"></div>') + '</div></div></div>';

            dw = $(html);

            scrollToPos();

            // Show
            s.display != 'inline' ? dw.appendTo('body') : elm.is('div') ? elm.html(dw) : dw.insertAfter(elm);
            visible = true;

            // Theme init
            theme.init(dw, that);

            if (s.display != 'inline') {
                // Init buttons
                $('.dwb-s a', dw).click(function () {
                    that.setValue(false, true);
                    that.hide();
                    s.onSelect.call(e, that.val, that);
                    return false;
                });

                $('.dwb-c a', dw).click(function () {
                    that.hide();
                    s.onCancel.call(e, that.val, that);
                    return false;
                });

                // Disable inputs to prevent bleed through (Android bug)
                $('input,select').each(function() {
                    if (!$(this).prop('disabled'))
                        $(this).addClass('dwtd');
                });
                $('input,select').prop('disabled', true);

                // Set position
                position();
                $(window).bind('resize.dw', position);
            }

            // Events
            dw.delegate('.dwwl', 'DOMMouseScroll mousewheel', function (e) {
                if (!s.readonly) {
                    e.preventDefault();
                    e = e.originalEvent;
                    var delta = e.wheelDelta ? (e.wheelDelta / 120) : (e.detail ? (-e.detail / 3) : 0),
                        t = $('ul', this),
                        p = +t.data('pos'),
                        val = Math.round(p - delta);
                    setGlobals(t);
                    calc(t, val, delta < 0 ? 1 : 2);
                }
            }).delegate('.dwb, .dwwb', START_EVENT, function (e) {
            	if(event.which != 1)
            		return false;
                // Active button
                $(this).addClass('dwb-a');
            }).delegate('.dwwb', START_EVENT, function (e) {
            	if(event.which != 1)
            		return false;
                if (!s.readonly && !$(this).closest('.dwwl').hasClass('dwa')) {
                    // + Button
                    e.preventDefault();
                    e.stopPropagation();
                    var t = $(this).closest('.dwwl').find('ul'),
                        func = $(this).hasClass('dwwbp') ? plus : minus;
                    click = true;
                    setGlobals(t);
                    clearInterval(timer);
                    timer = setInterval(function() { func(t); }, s.delay);
                    func(t);
                }
            }).delegate('.dwwl', START_EVENT, function (e) {
            	if(event.which != 1)
            		return false;
                // Scroll start
                if (!move && !s.readonly && !click) {
                    e.preventDefault();
                    move = true;
                    target = $('ul', this);
                    target.closest('.dwwl').addClass('dwa');
                    pos = +target.data('pos');
                    setGlobals(target);
                    clearInterval(iv[index]);
                    start = getY(e);
                    startTime = new Date();
                    stop = start;
                    that.scroll(target, pos);
                }
            });

            s.onShow.call(e, dw, that);
        }

        /**
        * Scroller initialization.
        */
        that.init = function(ss) {
            // Get theme defaults
            theme = $.extend({ defaults: {}, init: empty }, $.scroller.themes[ss.theme ? ss.theme : s.theme]);

            $.extend(s, theme.defaults, settings, ss);

            that.settings = s;

            m = Math.floor(s.rows / 2);

            var preset = $.scroller.presets[s.preset];

            elm.unbind('.dw');

            if (preset) {
                var p = preset.call(e, that);
                $.extend(s, p, settings, ss);
                // Extend core methods
                $.extend(methods, p.methods);
            }

            if (elm.data('dwro') !== undefined)
                e.readOnly = bool(elm.data('dwro'));

            if (visible)
                that.hide();

            if (s.display == 'inline') {
                that.show();
            }
            else {
                read();
                if (input && s.showOnFocus) {
                    // Set element readonly, save original state
                    elm.data('dwro', e.readOnly);
                    e.readOnly = true;
                    // Init show datewheel
                    elm.bind('focus.dw', that.show);
                }
            }
        }

        that.values = null;
        that.val = null;
        that.temp = null;

        that.init(settings);
    }

    function testProps(props) {
        for (var i in props) {
            if (mod[props[i]] !== undefined ) {
                return true;
            }
        }
        return false;
    }

    function testPrefix() {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms'];
        for (var p in prefixes) {
            if (testProps([prefixes[p] + 'Transform']))
                return '-' + prefixes[p].toLowerCase();
        }
        return '';
    }

    function getInst(e) {
        return scrollers[e.id];
    }

    function getY(e) {
        return touch ? (e.originalEvent ? e.originalEvent.changedTouches[0].pageY : e.changedTouches[0].pageY) : e.pageY;
    }

    function bool(v) {
        return (v === true || v == 'true');
    }

    function calc(t, val, dir, anim, orig) {
        val = val > max ? max : val;
        val = val < min ? min : val;

        var cell = $('li', t).eq(val);

        // Set selected scroller value
        inst.temp[index] = cell.attr('data-val');

        // Validate
        inst.validate(anim ? (val == orig ? 0.1 : Math.abs((val - orig) * 0.1)) : 0, orig, index, dir);
    }

    var scrollers = {},
        timer,
        empty = function() {},
        h,
        min,
        max,
        inst, // Current instance
        date = new Date(),
        uuid = date.getTime(),
        move,
        click,
        target,
        index,
        start,
        stop,
        startTime,
        endTime,
        pos,
        mod = document.createElement('modernizr').style,
        has3d = testProps(['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective']) && 'webkitPerspective' in document.documentElement.style,
        prefix = testPrefix(),
        touch = ('ontouchstart' in window),
        START_EVENT = touch ? 'touchstart' : 'mousedown',
        MOVE_EVENT = touch ? 'touchmove' : 'mousemove',
        END_EVENT = touch ? 'touchend' : 'mouseup',
        defaults = {
            // Options
            width: 70,
            height: 40,
            rows: 3,
            delay: 300,
            disabled: false,
            readonly: false,
            showOnFocus: true,
            showLabel: true,
            wheels: [],
            theme: '',
            headerText: '{value}',
            display: 'modal',
            mode: 'scroller',
            preset: '',
            setText: 'Set',
            cancelText: 'Cancel',
            // Events
            onShow: empty,
            onClose: empty,
            onSelect: empty,
            onCancel: empty,
            onChange: empty,
            formatResult: function(d) {
                var out = '';
                for (var i = 0; i < d.length; i++) {
                    out += (i > 0 ? ' ' : '') + d[i];
                }
                return out;
            },
            parseValue: function(val, inst) {
                var w = inst.settings.wheels,
                    val = val.split(' '),
                    ret = [],
                    j = 0;
                for (var i = 0; i < w.length; i++) {
                    for (var l in w[i]) {
                        if (w[i][l][val[j]] !== undefined)
                            ret.push(val[j])
                        else
                            // Select first value from wheel
                            for (var v in w[i][l]) {
                                ret.push(v);
                                break;
                            }
                        j++;
                    }
                }
                return ret;
            },
            validate: empty
        },

        methods = {
            init: function (options) {
                if (options === undefined) options = {};
                return this.each(function () {
                    if (!this.id) {
                        uuid += 1;
                        this.id = 'scoller' + uuid;
                    }
                    scrollers[this.id] = new Scroller(this, options);
                });
            },
            enable: function() {
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) inst.enable();
                });
            },
            disable: function() {
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) inst.disable();
                });
            },
            isDisabled: function() {
                var inst = getInst(this[0]);
                if (inst)
                    return inst.settings.disabled;
            },
            option: function(option, value) {
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        var obj = {};
                        if (typeof option === 'object')
                            obj = option;
                        else
                            obj[option] = value;
                        inst.init(obj);
                    }
                });
            },
            setValue: function(d, fill, time) {
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        inst.temp = d;
                        inst.setValue(true, fill, time);
                    }
                });
            },
            getInst: function() {
                return getInst(this[0]);
            },
            getValue: function() {
                var inst = getInst(this[0]);
                if (inst)
                    return inst.values;
            },
            show: function() {
                var inst = getInst(this[0]);
                if (inst)
                    return inst.show();
            },
            hide: function() {
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst)
                        inst.hide();
                });
            },
            destroy: function() {
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        inst.hide();
                        $(this).unbind('.dw');
                        delete scrollers[this.id];
                        if ($(this).is('input'))
                            this.readOnly = bool($(this).data('dwro'));
                    }
                });
            }
        };

    $(document).bind(MOVE_EVENT, function (e) {
        if (move) {
            e.preventDefault();
            stop = getY(e);
            var val = pos + (start - stop) / h;
            val = val > (max + 1) ? (max + 1) : val;
            val = val < (min - 1) ? (min - 1) : val;
            inst.scroll(target, val);
        }
    });

    $(document).bind(END_EVENT, function (e) {
    	if(event.which != 1)
    		return false;
    
        if (move) {
            e.preventDefault();
            var time = new Date() - startTime,
                val = pos + (start - stop) / h;
            val = val > (max + 1) ? (max + 1) : val;
            val = val < (min - 1) ? (min - 1) : val;

            if (time < 300) {
                var speed = (stop - start) / time;
                var dist = (speed * speed) / (2 * 0.0006);
                if (stop - start < 0) dist = -dist;
            }
            else {
                var dist = stop - start;
            }
            calc(target, Math.round(pos - dist / h), 0, true, Math.round(val));
            move = false;
            target = null;
        }
        if (click) {
            clearInterval(timer);
            click = false;
        }
        $('.dwb-a').removeClass('dwb-a');
    });

    $.fn.scroller = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        }
        else {
            $.error('Unknown method');
        }
    }

    $.scroller = {
        /**
        * Set settings for all instances.
        * @param {Object} o - New default settings.
        */
        setDefaults: function(o) {
            $.extend(defaults, o);
        },
        presets: {},
        themes: {}
    };

})(jQuery);
