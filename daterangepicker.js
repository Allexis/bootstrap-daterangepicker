/**
 * @version: 2.1.13
 * @author: Dan Grossman http://www.dangrossman.info/
 * @copyright: Copyright (c) 2012-2015 Dan Grossman. All rights reserved.
 * @license: Licensed under the MIT license. See http://www.opensource.org/licenses/mit-license.php
 * @website: https://www.improvely.com/
 */

(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define([
      'moment',
      'jquery',
      'exports'
    ], function (momentjs, $, exports) {
      root.daterangepicker = factory(root, exports, momentjs, $);
    });

  } else if (typeof exports !== 'undefined') {
    var momentjs = require('moment');
    var jQuery = (typeof window != 'undefined') ? window.jQuery : undefined;  //isomorphic issue
    if (!jQuery) {
      try {
        jQuery = require('jquery');
        if (!jQuery.fn) {
          jQuery.fn = {};
        } //isomorphic issue
      } catch (err) {
        if (!jQuery) {
          throw new Error('jQuery dependency not found');
        }
      }
    }

    factory(root, exports, momentjs, jQuery);

    // Finally, as a browser global.
  } else {
    root.daterangepicker = factory(root, {}, root.moment || moment, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this || {}, function (root, daterangepicker, moment, $) { // 'this' doesn't exist on a server

  var DateRangePicker = function (element, options, cb) {

    //default settings for options
    this.parentEl = 'body';
    this.element = $(element);
    this.startDate = options.date ? options.date.startDate : moment().startOf('day');
    this.endDate = options.date ? options.date.endDate : moment().endOf('day');
    this.minDate = false;
    this.maxDate = false;
    this.dateLimit = false;
    this.autoApply = false;
    this.singleDatePicker = false;
    this.showDropdowns = false;
    this.showWeekNumbers = false;
    this.timePicker = false;
    this.timePicker24Hour = false;
    this.timePickerIncrement = 1;
    this.timePickerSeconds = false;
    this.linkedCalendars = true;
    this.autoUpdateInput = true;
    this.ranges = {};
    this.singleDateAndTime = false;

    if (!this.startDate && !this.endDate) {
      this.startDate = moment().startOf('day');
      this.endDate = moment().endOf('day');
    }

    this.opens = 'right';
    if (this.element.hasClass('pull-right')) {
      this.opens = 'left';
    }

    this.drops = 'down';
    if (this.element.hasClass('dropup')) {
      this.drops = 'up';
    }

    this.buttonClasses = 'btn btn-sm';
    this.applyClass = '';
    this.cancelClass = 'btn-default';

    this.locale = {
      format:           'MM/DD/YYYY',
      separator:        ' - ',
      applyLabel:       'Apply',
      cancelLabel:      'Cancel',
      weekLabel:        'W',
      customRangeLabel: 'Custom Range',
      daysOfWeek:       moment.weekdaysMin(),
      monthNames:       moment.monthsShort(),
      firstDay:         0, // TODO: moment.localeData().firstDayOfWeek()
      startDate:        'Start date',
      endDate:          'End date',
      pickTime:         'Pick time:',
      nowLabel:         'Now',
      resetLabel:       'Reset',
      date:             'Date',
    };

    this.callback = function () {
    };

    //some state information
    this.isShowing = false;
    this.leftCalendar = {
      month: moment().clone().date(2)
    };
    this.rightCalendar = {
      month: moment().clone().date(2)
    };

    //custom options from user
    if (typeof options !== 'object' || options === null) {
      options = {};
    }

    //allow setting options with data attributes
    //data-api options will be overwritten with custom javascript options
    options = $.extend(this.element.data(), options);

    //
    // handle all the possible options overriding defaults
    //

    if (typeof options.locale === 'object') {

      if (typeof options.locale.format === 'string') {
        this.locale.format = options.locale.format;
      }

      if (typeof options.locale.separator === 'string') {
        this.locale.separator = options.locale.separator;
      }

      if (typeof options.locale.daysOfWeek === 'object') {
        this.locale.daysOfWeek = options.locale.daysOfWeek.slice();
      }

      if (typeof options.locale.monthNames === 'object') {
        this.locale.monthNames = options.locale.monthNames.slice();
      }

      if (typeof options.locale.firstDay === 'number') {
        this.locale.firstDay = options.locale.firstDay;
      }

      if (typeof options.locale.applyLabel === 'string') {
        this.locale.applyLabel = options.locale.applyLabel;
      }

      if (typeof options.locale.cancelLabel === 'string') {
        this.locale.cancelLabel = options.locale.cancelLabel;
      }

      if (typeof options.locale.weekLabel === 'string') {
        this.locale.weekLabel = options.locale.weekLabel;
      }

      if (typeof options.locale.customRangeLabel === 'string') {
        this.locale.customRangeLabel = options.locale.customRangeLabel;
      }

      if (typeof options.locale.invalidLabel === 'string') {
        this.locale.invalidLabel = options.locale.invalidLabel;
      }

      if (typeof options.locale.startDate === 'string') {
        this.locale.startDate = options.locale.startDate;
      }

      if (typeof options.locale.endDate === 'string') {
        this.locale.endDate = options.locale.endDate;
      }

      if (typeof options.locale.nowLabel === 'string') {
        this.locale.nowLabel = options.locale.nowLabel;
      }

    }

    if (typeof options.startDate === 'string') {
      this.setStartDate(moment(options.startDate, this.locale.format));
    }

    if (typeof options.endDate === 'string') {
      this.endDate = moment(options.endDate, this.locale.format);
    }

    if (typeof options.minDate === 'string') {
      this.minDate = moment(options.minDate, this.locale.format);
    }

    if (typeof options.maxDate === 'string') {
      this.maxDate = moment(options.maxDate, this.locale.format);
    }

    if (typeof options.startDate === 'object') {
      this.setStartDate(moment(options.startDate));
    }

    if (typeof options.endDate === 'object') {
      this.endDate = moment(options.endDate);
    }

    if (typeof options.minDate === 'object') {
      this.minDate = moment(options.minDate);
    }

    if (typeof options.maxDate === 'object') {
      this.maxDate = moment(options.maxDate);
    }

    // sanity check for bad options
    if (this.minDate && this.startDate && this.startDate.isBefore(this.minDate)) {
      this.startDate = this.minDate.clone();
    }

    // sanity check for bad options
    if (this.maxDate && this.endDate && this.endDate.isAfter(this.maxDate)) {
      this.endDate = this.maxDate.clone();
    }

    if (typeof options.applyClass === 'string') {
      this.applyClass = options.applyClass;
    }

    if (typeof options.cancelClass === 'string') {
      this.cancelClass = options.cancelClass;
    }

    if (typeof options.dateLimit === 'object') {
      this.dateLimit = options.dateLimit;
    }

    if (typeof options.opens === 'string') {
      this.opens = options.opens;
    }

    if (typeof options.drops === 'string') {
      this.drops = options.drops;
    }

    if (typeof options.showWeekNumbers === 'boolean') {
      this.showWeekNumbers = options.showWeekNumbers;
    }

    if (typeof options.buttonClasses === 'string') {
      this.buttonClasses = options.buttonClasses;
    }

    if (typeof options.buttonClasses === 'object') {
      this.buttonClasses = options.buttonClasses.join(' ');
    }

    if (typeof options.showDropdowns === 'boolean') {
      this.showDropdowns = options.showDropdowns;
    }

    if (typeof options.singleDatePicker === 'boolean') {
      this.singleDatePicker = options.singleDatePicker;
      if (this.singleDatePicker) {
        this.endDate = this.startDate.clone();
      }
    }

    if (typeof options.singleDateAndTime === 'boolean') {
        this.singleDateAndTime = options.singleDateAndTime;
        if (this.singleDateAndTime)
            this.endDate = this.startDate.clone();
    }

    if (typeof options.timePicker === 'boolean') {
      this.timePicker = options.timePicker;
    }

    if (typeof options.timePickerSeconds === 'boolean') {
      this.timePickerSeconds = options.timePickerSeconds;
    }

    if (typeof options.timePickerIncrement === 'number') {
      this.timePickerIncrement = options.timePickerIncrement;
    }

    if (typeof options.timePicker24Hour === 'boolean') {
      this.timePicker24Hour = options.timePicker24Hour;
    }

    if (typeof options.autoApply === 'boolean') {
      this.autoApply = options.autoApply;
    }

    if (typeof options.autoUpdateInput === 'boolean') {
      this.autoUpdateInput = options.autoUpdateInput;
    }

    if (typeof options.linkedCalendars === 'boolean') {
      this.linkedCalendars = options.linkedCalendars;
    }

    if (typeof options.isInvalidDate === 'function') {
      this.isInvalidDate = options.isInvalidDate;
    }

    // update day names order to firstDay
    if (this.locale.firstDay != 0) {
      var iterator = this.locale.firstDay;
      while (iterator > 0) {
        this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
        iterator--;
      }
    }

    //html template for the picker UI
    if (typeof options.template !== 'string') {
      options.template = '<div class="daterangepicker dropdown-menu">' +
        '<div class="ranges">' +
        '<div class="range_inputs">' +
        '</div>' +
        '</div>' +
        // input left
        '<div class="picker">' +
        '<div class="daterangepicker_input start_date">' +
        '<div class="daterangepicker_input_container">' +
        '<span class="daterangepicker_start_label">' + this.locale.startDate + '</span>' +
        '<span class="daterangepicker_start"></span>' +
        '</div>' +
        '<i class="fa fa-calendar glyphicon glyphicon-calendar"></i>' +
        '<div class="calendar-time">' +
        '<div></div>' +
        '<i class="fa fa-clock-o glyphicon glyphicon-time"></i>' +
        '</div>' +
        '</div>' +
        '<div class="daterangepicker_space"></div>' +
        // input right
        '<div class="daterangepicker_input end_date">' +
        '<div class="daterangepicker_input_container">' +
        '<span class="daterangepicker_end_label">' + this.locale.endDate + '</span>' +
        '<span class="daterangepicker_end"></span>' +
        '</div>' +
        '<i class="fa fa-calendar glyphicon glyphicon-calendar"></i>' +
        '<div class="calendar-time">' +
        '<div></div>' +
        '<i class="fa fa-clock-o glyphicon glyphicon-time"></i>' +
        '</div>' +
        '</div>' +
        '<div style="clear:both;"></div>' +
        // calendar left
        '<div class="calendar left">' +
        '<div class="calendar-table"></div>' +
        '</div>' +
        // calendar right
        '<div class="calendar right">' +
        '<div class="calendar-table"></div>' +
        '</div>' +
        '<div class="picktime time-picker times">' +
        '<div class="time left"></div>' +
        '<div class="time right"></div>' +
        '</div>' +
        '</div>' +
        // time picker
        '<p class="picktime"></p>' +
        '<button class="applyBtn" type="button" style="width:100%;"></button>' +
        '</div>';
    }

    this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
    this.container = $(options.template).appendTo(this.parentEl);

    var start, end, range;

    //if no start/end dates set, check if an input element contains initial values
    if (typeof options.startDate === 'undefined' && typeof options.endDate === 'undefined') {
      if ($(this.element).is('input[type=text]')) {
        var val   = $(this.element).val(),
            split = val.split(this.locale.separator);

        start = end = null;

        if (split.length == 2) {
          start = moment(split[0], this.locale.format);
          end = moment(split[1], this.locale.format);
        } else if (this.singleDatePicker && val !== "") {
          start = moment(val, this.locale.format);
          end = moment(val, this.locale.format);
        }
        if (start !== null && end !== null) {
          this.setStartDate(start);
          this.setEndDate(end);
        }
      }
    }

    if (typeof options.ranges === 'object') {
      for (range in options.ranges) {

        if (typeof options.ranges[range][0] === 'string') {
          start = moment(options.ranges[range][0], this.locale.format);
        } else {
          start = moment(options.ranges[range][0]);
        }

        if (typeof options.ranges[range][1] === 'string') {
          end = moment(options.ranges[range][1], this.locale.format);
        } else {
          end = moment(options.ranges[range][1]);
        }

        // If the start or end date exceed those allowed by the minDate or dateLimit
        // options, shorten the range to the allowable period.
        if (this.minDate && start.isBefore(this.minDate)) {
          start = this.minDate.clone();
        }

        var maxDate = this.maxDate;
        if (this.dateLimit && start.clone().add(this.dateLimit).isAfter(maxDate)) {
          maxDate = start.clone().add(this.dateLimit);
        }
        if (maxDate && end.isAfter(maxDate)) {
          end = maxDate.clone();
        }

        // If the end of the range is before the minimum or the start of the range is
        // after the maximum, don't display this range option at all.
        if ((this.minDate && end.isBefore(this.minDate)) || (maxDate && start.isAfter(maxDate))) {
          continue;
        }

        //Support unicode chars in the range names.
        var elem = document.createElement('textarea');
        elem.innerHTML = range;
        rangeHtml = elem.value;

        this.ranges[rangeHtml] = options.ranges[range];
      }

      var list = '<ul>';
      for (range in this.ranges) {
        list += '<li data-range="' + range + '" data-date-range-type-id="' + options.ranges[range].dateRangeTypeId + '">' + this.ranges[range].displayName + '</li>';
      }
      list += '<li>' + this.locale.customRangeLabel + '</li>';
      list += '</ul>';
      this.container.find('.ranges').html(list);
    } else {
      this.container.find('.ranges').hide();
    }

    if (typeof cb === 'function') {
      this.callback = cb;
    }

    if (!this.timePicker) {
      if (this.startDate) {
        this.startDate = this.startDate.startOf('day');
      }
      if (this.endDate) {
        this.endDate = this.endDate.endOf('day');
      }
      this.container.find('.calendar-time').hide();
    }

    //can't be used together for now
    if (this.timePicker && this.autoApply) {
      this.autoApply = false;
    }

    if (this.autoApply && typeof options.ranges !== 'object') {
      this.container.find('.ranges').hide();
    } else if (this.autoApply) {
      this.container.find('.applyBtn, .cancelBtn').addClass('hide');
    }

    if (this.singleDatePicker || this.singleDateAndTime) {
      this.container.addClass('single');
      this.container.find('.calendar.left').addClass('single');
      this.container.find('.calendar.left').show();
      this.container.find('.calendar.right').hide();
      this.container.find('.daterangepicker_input input, .daterangepicker_input i').hide();
      if (!this.timePicker) {
        this.container.find('.ranges').hide();
      }
    }

    if (typeof options.ranges === 'undefined' && !this.singleDatePicker && !this.singleDateAndTime) {
      this.container.addClass('show-calendar');
    }

    this.container.addClass('opens' + this.opens);

    // Add reset button if no ranges are available
    if (!options.ranges || Object.keys(options.ranges).length === 0) {
      this.container.find('.applyBtn').css('width', '50%').css('float', 'left');
      this.container.find('.applyBtn').after('<button class="resetBtn" type="button" style="width:50%; float:left;"></button>');
    }

    //apply CSS classes and labels to buttons
    this.container.find('.applyBtn, .cancelBtn, .resetBtn').addClass(this.buttonClasses);
    if (this.applyClass.length) {
      this.container.find('.applyBtn').addClass(this.applyClass);
    }
    if (this.cancelClass.length) {
      this.container.find('.cancelBtn').addClass(this.cancelClass);
    }
    this.container.find('.applyBtn').html(this.locale.applyLabel);
    this.container.find('.cancelBtn').html(this.locale.cancelLabel);
    this.container.find('.resetBtn').html(this.locale.resetLabel);

    //
    // event listeners
    //
    this.container
      .on('click.daterangepicker', 'button.applyBtn', $.proxy(this.clickApply, this))
      .on('click.daterangepicker', 'button.resetBtn', $.proxy(this.clickReset, this))

    this.container.find('.calendar')
      .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
      .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
      .on('click.daterangepicker', '.prevYear', $.proxy(this.clickPrevYear, this))
      .on('click.daterangepicker', '.nextYear', $.proxy(this.clickNextYear, this))
      .on('click.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
      .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))
      .on('mouseleave.daterangepicker', 'td.available', $.proxy(this.updateFormInputs, this))
      .on('change.daterangepicker', 'select.yearselect', $.proxy(this.monthOrYearChanged, this))
      .on('change.daterangepicker', 'select.monthselect', $.proxy(this.monthOrYearChanged, this))
      .on('click.daterangepicker', '.daterangepicker_input input', $.proxy(this.showCalendars, this))
      //.on('keyup.daterangepicker', '.daterangepicker_input input', $.proxy(this.formInputsChanged, this))
      .on('change.daterangepicker', '.daterangepicker_input input', $.proxy(this.formInputsChanged, this));

    this.container.find('.time-picker')
      .on('change.daterangepicker', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', $.proxy(this.timeChanged, this))
      .on('click.daterangepicker', '.now', $.proxy(this.nowButton, this))

    this.container.find('.ranges')
      .on('click.daterangepicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))
      .on('click.daterangepicker', 'li', $.proxy(this.clickRange, this))
    //.on('mouseenter.daterangepicker', 'li', $.proxy(this.hoverRange, this))
    //.on('mouseleave.daterangepicker', 'li', $.proxy(this.updateFormInputs, this));

    this.container.find('.time-picker li.start-date')
      .on('click', $.proxy(this.showCalendar, this, 'left'));

    this.container.find('.time-picker li.end-date')
      .on('click', $.proxy(this.showCalendar, this, 'right'));

    var that = this;

    this.container.find('span.daterangepicker_start').parent()
      .on('click', function () {
        that.showCalendar('left');
      });

    this.container.find('span.daterangepicker_end').parent()
      .on('click', function () {
        that.showCalendar('right');
      });

    if (this.element.is('input')) {
      this.element.on({
        'click.daterangepicker':   $.proxy(this.show, this),
        'focus.daterangepicker':   $.proxy(this.show, this),
        'keyup.daterangepicker':   $.proxy(this.elementChanged, this),
        'keydown.daterangepicker': $.proxy(this.keydown, this)
      });
    } else {
      this.element.on('click.daterangepicker', $.proxy(this.toggle, this));
    }

    //
    // if attached to a text input, set the initial value
    //

    if (this.element.is('input') && !this.singleDatePicker && !this.singleDateAndTime && this.autoUpdateInput) {
      this.element.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
      this.element.trigger('change');
    } else if (this.element.is('input') && this.autoUpdateInput) {
      this.element.val(this.startDate.format(this.locale.format));
      this.element.trigger('change');
    }

  };

  DateRangePicker.prototype = {

    constructor: DateRangePicker,
    initial:     true,

    showCalendar: function (side) {

      // overwrite side to 'disable' start/enddate for specific ranges
      if (this.chosenLabel === 'after_date') {
        side = 'left';
      } else if (this.chosenLabel === 'before_date') {
        side = 'right';
      }

      if (side === 'left') {
        this.container.find('span.daterangepicker_start').parent().addClass('active');
        this.container.find('.time-picker li.start-date').addClass('active');
        this.container.find('span.daterangepicker_end').parent().removeClass('active');
        this.container.find('.time-picker li.end-date').removeClass('active');
        this.container.find('.left').show();
        this.container.find('.right').hide();
        this.startDateSelected = true;

        if (this.endDate && (this.endDate.isBefore(moment()) || this.endDate.isSame(moment(), 'minute'))) {
          $('.now').attr('disabled', 'disabled');
        } else {
          $('.now').removeAttr('disabled');
        }

      } else if (side === 'right') {
        this.container.find('span.daterangepicker_start').parent().removeClass('active');
        this.container.find('.time-picker li.start-date').removeClass('active');
        this.container.find('span.daterangepicker_end').parent().addClass('active');
        this.container.find('.time-picker li.end-date').addClass('active');
        this.container.find('.left').hide();
        this.container.find('.right').show();
        this.startDateSelected = false;

        if (this.startDate && (this.startDate.isAfter(moment()) || this.startDate.isSame(moment(), 'minute'))) {
          $('.now').attr('disabled', 'disabled');
        } else {
          $('.now').removeAttr('disabled');
        }

      }
    },

    setStartDate: function (startDate) {

      if (!moment(startDate).isValid()) {
        this.startDate = null;
        this.updateMonthsInView();
        return;
      }

      if (typeof startDate === 'string') {
        this.startDate = moment(startDate, this.locale.format);
      }

      if (typeof startDate === 'object') {
        this.startDate = moment(startDate);
      }

      if (!this.timePicker && this.startDate) {
        this.startDate = this.startDate.startOf('day');
      }

      if (this.timePicker && this.startDate && this.timePickerIncrement) {
        this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
      }

      if (this.minDate && this.startDate && this.startDate.isBefore(this.minDate)) {
        this.startDate = this.minDate;
      }

      if (this.maxDate && this.startDate && this.startDate.isAfter(this.maxDate)) {
        this.startDate = this.maxDate;
      }

      if (!this.isShowing) {
        this.updateElement();
      }

      if (this.chosenLabel === 'specific_date') {
        this.endDate = this.startDate.clone().endOf('day');
      } else if (this.chosenLabel === 'after_date') {
        this.endDate = null;
      }

      if (this.startDate && this.endDate && this.startDate.isAfter(this.endDate)) {
        this.endDate = null;
      }

      if (this.startDate && this.endDate && this.startDate.isSame(this.endDate, 'minute')) {
        this.endDate.add(1, 'minute');
      }

      if (this.minDate && this.startDate.isBefore(this.minDate)) {
        this.startDate = this.minDate.clone();
      }

      if(this.singleDateAndTime) {
        this.endDate = this.startDate.clone();
      }

      this.updateMonthsInView();
    },

    setEndDate: function (endDate) {

      if (!moment(endDate).isValid()) {
        this.endDate = null;
        this.updateMonthsInView();
        return;
      }

      if (typeof endDate === 'string') {
        this.endDate = moment(endDate, this.locale.format);
      }

      if (typeof endDate === 'object') {
        this.endDate = moment(endDate);
      }

      if (!this.timePicker && this.endDate) {
        this.endDate = this.endDate.endOf('day');
      }

      if (this.timePicker && this.endDate && this.timePickerIncrement) {
        this.endDate.minute(Math.round(this.endDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
      }

      if (this.endDate && this.endDate.isBefore(this.startDate)) {
        this.endDate = this.startDate.clone();
      }

      if (this.maxDate && this.endDate && this.endDate.isAfter(this.maxDate)) {
        this.endDate = this.maxDate.clone();
      }

      if (this.dateLimit && this.startDate && this.endDate && this.startDate.clone().add(this.dateLimit).isBefore(this.endDate)) {
        this.endDate = this.startDate.clone().add(this.dateLimit);
      }

      if (this.startDate && this.endDate && this.startDate.isSame(this.endDate, 'minute')) {
        this.endDate.add(1, 'minute');
      }

      if (!this.isShowing) {
        this.updateElement();
      }

      if (this.chosenLabel === 'before_date') {
        this.startDate = null;
      }

      if (this.maxDate && this.endDate.isAfter(this.maxDate)) {
        this.endDate = this.maxDate.clone();
      }

      if(this.singleDateAndTime) {
        this.endDate = this.startDate.clone();
      }

      this.updateMonthsInView();
    },

    isInvalidDate: function () {
      return false;
    },

    updateView: function () {

      if (this.startDateSelected === undefined) {
        this.showCalendar('left');
      }

      if (this.timePicker) {
        this.renderTimePicker('left');
        this.renderTimePicker('right');
        if (!this.endDate) {
          this.container.find('.right .calendar-time select').attr('disabled', 'disabled').addClass('disabled');
        } else {
          this.container.find('.right .calendar-time select').removeAttr('disabled').removeClass('disabled');
        }
      }

      this.updateMonthsInView();
      this.updateCalendars();
      this.updateFormInputs();
      this.updateRangeSelection();

    },

    updateRangeSelection: function () {

      var label;

      if (this.singleDateAndTime || [
          'today',
          'yesterday'
        ].indexOf(this.chosenLabel) !== -1) {

        if(this.singleDateAndTime) {
          label = this.locale.date;
        } else {
          label = this.container.find('.ranges *[data-range="' + this.chosenLabel + '"]').html();
        }

        this.showCalendar('left');
        this.singleDatePicker = true;
        $('.daterangepicker_start_label').html(label);

      } else {

        $('.daterangepicker_start_label').html(this.locale.startDate);
        this.singleDatePicker = false;

      }

      if (this.ranges[this.chosenLabel] && this.ranges[this.chosenLabel].hideTimePicker) {
        this.timePicker = false;
        this.container.find('.time-picker').hide();
      } else {
        this.timePicker = true;
        this.container.find('.time-picker').show();
      }

    },

    updateMonthsInView: function () {

      if (this.startDate && this.leftCalendar.month.format('YYYY-MM') != this.startDate.format('YYYY-MM')) {
        this.leftCalendar.month = this.startDate.clone().date(2);
        this.renderCalendar('left');
      }

      if (this.endDate && this.rightCalendar.month.format('YYYY-MM') != this.endDate.format('YYYY-MM')) {
        this.rightCalendar.month = this.endDate.clone().date(2);
        this.renderCalendar('right');
      }

      if (this.startDate && this.endDate && (this.endDate.month() != this.startDate.month() || this.endDate.year() != this.startDate.year())) {
        if (!this.linkedCalendars) {
          this.rightCalendar.month = this.endDate.clone().date(2);
        }
      }

    },

    updateCalendars: function () {

      if (this.timePicker) {

        var hour, minute, second;

        if (this.startDate) {
          hour = parseInt(this.container.find('.time.left .hourselect').val(), 10) || 0;
          minute = parseInt(this.container.find('.time.left .minuteselect').val(), 10) || 0;
          second = this.timePickerSeconds ? parseInt(this.container.find('.time.left .secondselect').val(), 10) : 0;

          if (!this.timePicker24Hour) {
            var ampm = this.container.find('.time.left .ampmselect').val() || 'AM';
            if (ampm === 'PM' && hour < 12) {
              hour += 12;
            }
            if (ampm === 'AM' && hour === 12) {
              hour = 0;
            }
          }

          this.leftCalendar.month.hour(hour).minute(minute).second(second);
          this.renderTimePicker('left');
        }

        if (this.endDate) {
          hour = parseInt(this.container.find('.time.right .hourselect').val(), 10) || '11';
          minute = parseInt(this.container.find('.time.right .minuteselect').val(), 10) || '59';
          second = this.timePickerSeconds ? parseInt(this.container.find('.time.right .secondselect').val(), 10) : 0;
          if (!this.timePicker24Hour) {
            var ampm = this.container.find('.time.left .ampmselect').val() || 'PM';
            if (ampm === 'PM' && hour < 12) {
              hour += 12;
            }
            if (ampm === 'AM' && hour === 12) {
              hour = 0;
            }
          }

          this.rightCalendar.month.hour(hour).minute(minute).second(second);
          this.renderTimePicker('right');
        }

      }

      this.renderCalendar('left');
      this.renderCalendar('right');

      //highlight any predefined range matching the current start and end dates
      this.container.find('.ranges li').removeClass('active');

      var customRange = true;
      var i = 0;

      if (!this.singleDateAndTime && Object.keys(this.ranges).length > 0) {

        if (this.startDate && this.endDate && this.chosenLabel !== 'specific_date') {

          this.container.removeClass(this.chosenLabel);

          for (var range in this.ranges) {
            if (this.timePicker) {
              if (this.ranges[range][0] && this.ranges[range][1] && this.startDate.isSame(this.ranges[range][0]) && this.endDate.isSame(this.ranges[range][1])) {
                customRange = false;
                this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')').addClass('active').data('range') || this.container.find('.ranges li:eq(' + i + ')').addClass('active').data('range');
                break;
              }
            } else {
              //ignore times when comparing dates if time picker is not enabled
              if (this.ranges[range][0] && this.ranges[range][1] && this.startDate.format('YYYY-MM-DD') == this.ranges[range][0].format('YYYY-MM-DD') && this.endDate.format('YYYY-MM-DD') == this.ranges[range][1].format('YYYY-MM-DD')) {
                customRange = false;
                this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')').addClass('active').data('range') || this.container.find('.ranges li:eq(' + i + ')').addClass('active').data('range');
                break;
              }
            }
            i++;
          }

        }

        if (customRange) {
          if (this.startDate && !this.endDate && this.chosenLabel !== this.locale.customRangeLabel) {
            this.chosenLabel = this.container.find('.ranges li[data-range="after_date"]').addClass('active').data('range');
            this.showCalendar('left');
            customRange = false;
          } else if (!this.startDate && this.endDate && this.chosenLabel !== this.locale.customRangeLabel) {
            this.chosenLabel = this.container.find('.ranges li[data-range="before_date"]').addClass('active').data('range');
            this.showCalendar('right');
            customRange = false;
          } else if (this.startDate && this.endDate && this.startDate.dayOfYear() === this.endDate.dayOfYear()) {
            if (this.chosenLabel !== 'specific_date') {
              this.showCalendar('left');
              this.setStartDate(this.startDate.clone().startOf('day'));
              this.setEndDate(this.endDate.clone().endOf('day'));
            }

            this.chosenLabel = this.container.find('.ranges li[data-range="specific_date"]').addClass('active').data('range');

            customRange = false;
          }
        }

        if (customRange) {
          this.chosenLabel = this.container.find('.ranges li:last').addClass('active').html();
          this.showCalendars();
        }

        this.container.addClass(this.chosenLabel);

      }

    },

    renderCalendar: function (side) {

      //
      // Build the matrix of dates that will populate the calendar
      //

      var calendar = side == 'left' ? this.leftCalendar : this.rightCalendar;
      var month = calendar.month.month();
      var year = calendar.month.year();
      var hour = calendar.month.hour();
      var minute = calendar.month.minute();
      var second = calendar.month.second();
      var daysInMonth = moment([
        year,
        month
      ]).daysInMonth();
      var firstDay = moment([
        year,
        month,
        1
      ]);
      var lastDay = moment([
        year,
        month,
        daysInMonth
      ]);
      var lastMonth = moment(firstDay).subtract(1, 'month').month();
      var lastYear = moment(firstDay).subtract(1, 'month').year();
      var daysInLastMonth = moment([
        lastYear,
        lastMonth
      ]).daysInMonth();
      var dayOfWeek = firstDay.day();

      //initialize a 6 rows x 7 columns array for the calendar
      var calendar = [];
      calendar.firstDay = firstDay;
      calendar.lastDay = lastDay;

      for (var i = 0; i < 6; i++) {
        calendar[i] = [];
      }

      //populate the calendar with date objects
      var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
      if (startDay > daysInLastMonth) {
        startDay -= 7;
      }

      if (dayOfWeek == this.locale.firstDay) {
        startDay = daysInLastMonth - 6;
      }

      var curDate = moment([
        lastYear,
        lastMonth,
        startDay,
        12,
        minute,
        second
      ]);

      var col, row;
      for (var i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = moment(curDate).add(24, 'hour')) {
        if (i > 0 && col % 7 === 0) {
          col = 0;
          row++;
        }
        calendar[row][col] = curDate.clone().hour(hour).minute(minute).second(second);
        curDate.hour(12);

        if (this.minDate && calendar[row][col].format('YYYY-MM-DD') == this.minDate.format('YYYY-MM-DD') && calendar[row][col].isBefore(this.minDate) && side == 'left') {
          calendar[row][col] = this.minDate.clone();
        }

        if (this.maxDate && calendar[row][col].format('YYYY-MM-DD') == this.maxDate.format('YYYY-MM-DD') && calendar[row][col].isAfter(this.maxDate) && side == 'right') {
          calendar[row][col] = this.maxDate.clone();
        }

      }

      //make the calendar object available to hoverDate/clickDate
      if (side == 'left') {
        this.leftCalendar.calendar = calendar;
      } else {
        this.rightCalendar.calendar = calendar;
      }

      //
      // Display the calendar
      //

      var minDate = side == 'left' ? this.minDate : this.startDate;
      var maxDate = this.maxDate;
      var selected = side == 'left' ? this.startDate : this.endDate;

      var html = '<table class="table-condensed month-year-switch">';
      html += '<thead>';
      html += '<tr>';

      // add empty cell for week number
      if (this.showWeekNumbers) {
        html += '<td></td>';
      }

      html += '<td><i class="prev available icon icon-arrow-triangle-left"></i>';

      var dateHtml  = this.locale.monthNames[calendar[1][1].month()] + calendar[1][1].format(" YYYY"),
          monthHtml = this.locale.monthNames[calendar[1][1].month()],
          yearHtml  = calendar[1][1].format(" YYYY");

      if (this.showDropdowns) {
        var currentMonth = calendar[1][1].month();
        var currentYear = calendar[1][1].year();
        var maxYear = (maxDate && maxDate.year()) || (currentYear + 5);
        var minYear = (minDate && minDate.year()) || (currentYear - 50);
        var inMinYear = currentYear == minYear;
        var inMaxYear = currentYear == maxYear;

        var monthHtml = '<select class="monthselect">';
        for (var m = 0; m < 12; m++) {
          if ((!inMinYear || m >= minDate.month()) && (!inMaxYear || m <= maxDate.month())) {
            monthHtml += "<option value='" + m + "'" +
              (m === currentMonth ? " selected='selected'" : "") +
              ">" + this.locale.monthNames[m] + "</option>";
          } else {
            monthHtml += "<option value='" + m + "'" +
              (m === currentMonth ? " selected='selected'" : "") +
              " disabled='disabled'>" + this.locale.monthNames[m] + "</option>";
          }
        }
        monthHtml += "</select>";

        var yearHtml = '<select class="yearselect">';
        for (var y = minYear; y <= maxYear; y++) {
          yearHtml += '<option value="' + y + '"' +
            (y === currentYear ? ' selected="selected"' : '') +
            '>' + y + '</option>';
        }
        yearHtml += '</select>';

        dateHtml = monthHtml + yearHtml;
      }

      html += monthHtml;
      html += '<i class="next available icon icon-arrow-triangle-right"></i>';

      html += '</td><td>';

      html += '<i class="prevYear available icon icon-arrow-triangle-left"></i>';
      html += yearHtml;
      html += '<i class="nextYear available icon icon-arrow-triangle-right"></i>';
      html += '</td>';

      html += '</tr>';
      html += '</thead>';
      html += '</table>';
      html += '<table class="table-condensed">';
      html += '<thead>';

      html += '<tr>';

      // add week number label
      if (this.showWeekNumbers) {
        html += '<th class="week">' + this.locale.weekLabel + '</th>';
      }

      $.each(this.locale.daysOfWeek, function (index, dayOfWeek) {
        html += '<th>' + dayOfWeek + '</th>';
      });

      html += '</tr>';
      html += '</thead>';
      html += '<tbody>';

      //adjust maxDate to reflect the dateLimit setting in order to
      //grey out end dates beyond the dateLimit
      if (this.endDate == null && this.dateLimit) {
        var maxLimit = this.startDate.clone().add(this.dateLimit).endOf('day');
        if (!maxDate || maxLimit.isBefore(maxDate)) {
          maxDate = maxLimit;
        }
      }

      for (var row = 0; row < 6; row++) {
        html += '<tr>';

        // add week number
        if (this.showWeekNumbers) {
          html += '<td class="week">' + calendar[row][0].week() + '</td>';
        }

        for (var col = 0; col < 7; col++) {

          var classes = [],
              cname   = '';

          if (this.startDate || this.endDate) {

            //highlight today's date
            if (calendar[row][col].isSame(new Date(), "day")) {
              classes.push('today');
            }

            //highlight weekends
            if (calendar[row][col].isoWeekday() > 5) {
              classes.push('weekend');
            }

            //grey out the dates in other months displayed at beginning and end of this calendar
            if (calendar[row][col].month() != calendar[1][1].month()) {
              classes.push('off');
            }

            //don't allow selection of dates before the minimum date
            if (this.minDate && calendar[row][col].isBefore(this.minDate, 'day')) {
              classes.push('disabled');
            }

            //don't allow selection of dates after the maximum date
            if (maxDate && calendar[row][col].isAfter(maxDate, 'day')) {
              classes.push('disabled');
            }

            //don't allow selection of date if a custom function decides it's invalid
            if (this.isInvalidDate(calendar[row][col])) {
              classes.push('disabled');
            }

            //highlight the currently selected start date
            if (this.startDate && calendar[row][col].format('YYYY-MM-DD') == this.startDate.format('YYYY-MM-DD')) {
              classes.push('active', 'start-date');
            }

            //highlight the currently selected end date
            if (this.endDate != null && calendar[row][col].format('YYYY-MM-DD') == this.endDate.format('YYYY-MM-DD')) {
              classes.push('active', 'end-date');
            }

            //highlight dates in-between the selected dates
            if (((this.endDate != null && calendar[row][col] < this.endDate) || (!this.endDate && this.chosenLabel !== this.locale.customRangeLabel && Object.keys(this.ranges).length > 0 )) && calendar[row][col] > this.startDate) {
              classes.push('in-range');
            }

            var disabled = false;
            for (var i = 0; i < classes.length; i++) {
              cname += classes[i] + ' ';
              if (classes[i] == 'disabled') {
                disabled = true;
              }
            }
            if (!disabled) {
              cname += 'available';
            }

          }

          if (classes.indexOf('off') === -1) {
            html += '<td class="' + cname.replace(/^\s+|\s+$/g, '') + '" data-title="' + 'r' + row + 'c' + col + '">' + calendar[row][col].date() + '</td>';
          } else if (classes.indexOf('disabled') !== -1 && classes.indexOf('off') === -1) {
            html += '<td class="disabled">' + calendar[row][col].date() + '</td>';
          } else {
            html += '<td class="off"></td>';
          }
        }
        html += '</tr>';
      }

      html += '</tbody>';
      html += '</table>';

      this.container.find('.calendar.' + side + ' .calendar-table').html(html);

    },

    renderTimePicker: function (side) {

      var html, selected, minDate, maxDate = this.maxDate;

      if (this.dateLimit && (!this.maxDate || this.startDate.clone().add(this.dateLimit).isAfter(this.maxDate))) {
        maxDate = this.startDate.clone().add(this.dateLimit);
      } else if (this.maxDate) {
        maxDate = this.maxDate.clone();
      }

      if (side == 'left' && this.startDate) {
        selected = this.startDate.clone();
        minDate = this.minDate;
      } else if (side == 'right' && (this.endDate || this.startDate)) {
        selected = this.endDate ? this.endDate.clone() : this.startDate.clone().endOf('day');
        minDate = this.startDate;
      }

      if (selected) {

        //
        // hours
        //

        html = '<select class="hourselect">';

        var start = this.timePicker24Hour ? 0 : 1;
        var end = this.timePicker24Hour ? 23 : 12;

        for (var i = start; i <= end; i++) {
          var i_in_24 = i;
          if (!this.timePicker24Hour) {
            i_in_24 = selected.hour() >= 12 ? (i == 12 ? 12 : i + 12) : (i == 12 ? 0 : i);
          }

          var time = selected.clone().hour(i_in_24);
          var disabled = false;
          if (minDate && time.minute(59).isBefore(minDate)) {
            disabled = true;
          }
          if (maxDate && time.minute(0).isAfter(maxDate)) {
            disabled = true;
          }

          if (i_in_24 == selected.hour() && !disabled) {
            html += '<option value="' + i + '" selected="selected">' + i + '</option>';
          } else if (disabled) {
            html += '<option value="' + i + '" disabled="disabled" class="disabled">' + i + '</option>';
          } else {
            html += '<option value="' + i + '">' + i + '</option>';
          }
        }

        html += '</select> ';

        //
        // minutes
        //

        html += ': <select class="minuteselect">';

        for (var i = 0; i < 60; i += this.timePickerIncrement) {
          var padded = i < 10 ? '0' + i : i;
          var time = selected.clone().minute(i);

          var disabled = false;
          if (minDate && time.second(59).isBefore(minDate)) {
            disabled = true;
          }
          if (maxDate && time.second(0).isAfter(maxDate)) {
            disabled = true;
          }

          if (selected.minute() == i && !disabled) {
            html += '<option value="' + i + '" selected="selected">' + padded + '</option>';
          } else if (disabled) {
            html += '<option value="' + i + '" disabled="disabled" class="disabled">' + padded + '</option>';
          } else {
            html += '<option value="' + i + '">' + padded + '</option>';
          }
        }

        html += '</select> ';

        //
        // seconds
        //

        if (this.timePickerSeconds) {
          html += ': <select class="secondselect">';

          for (var i = 0; i < 60; i++) {
            var padded = i < 10 ? '0' + i : i;
            var time = selected.clone().second(i);

            var disabled = false;
            if (minDate && time.isBefore(minDate)) {
              disabled = true;
            }
            if (maxDate && time.isAfter(maxDate)) {
              disabled = true;
            }

            if (selected.second() == i && !disabled) {
              html += '<option value="' + i + '" selected="selected">' + padded + '</option>';
            } else if (disabled) {
              html += '<option value="' + i + '" disabled="disabled" class="disabled">' + padded + '</option>';
            } else {
              html += '<option value="' + i + '">' + padded + '</option>';
            }
          }

          html += '</select> ';
        }

        //
        // AM/PM
        //

        if (!this.timePicker24Hour) {
          html += '<select class="ampmselect">';

          var am_html = '';
          var pm_html = '';

          if (minDate && selected.clone().hour(12).minute(0).second(0).isBefore(minDate)) {
            am_html = ' disabled="disabled" class="disabled"';
          }

          if (maxDate && selected.clone().hour(0).minute(0).second(0).isAfter(maxDate)) {
            pm_html = ' disabled="disabled" class="disabled"';
          }

          if (selected.hour() >= 12) {
            html += '<option value="AM"' + am_html + '>AM</option><option value="PM" selected="selected"' + pm_html + '>PM</option>';
          } else {
            html += '<option value="AM" selected="selected"' + am_html + '>AM</option><option value="PM"' + pm_html + '>PM</option>';
          }

          html += '</select>';
        }

      }

      html += '<button class="now">' + this.locale.nowLabel + '</button>';

      //this.container.find('.calendar.' + side + ' .calendar-time div').html(html);
      this.container.find('.time-picker .' + side).html(html);

    },

    updateFormInputs: function () {

      if (this.startDate) {
        this.container.find('input[name=daterangepicker_start]').val(this.startDate.format(this.locale.format));
        this.container.find('span.daterangepicker_start').html(this.startDate.format(this.locale.format));
      } else {
        this.container.find('input[name=daterangepicker_start]').val('∞');
        this.container.find('span.daterangepicker_start').html('∞');
      }

      if (this.endDate) {
        this.container.find('input[name=daterangepicker_end]').val(this.endDate.format(this.locale.format));
        this.container.find('span.daterangepicker_end').html(this.endDate.format(this.locale.format));
      } else {
        this.container.find('input[name=daterangepicker_end]').val('∞');
        this.container.find('span.daterangepicker_end').html('∞');
      }

      if (this.singleDateAndTime || this.singleDatePicker || (this.endDate && this.startDate && (this.startDate.isBefore(this.endDate) || this.startDate.isSame(this.endDate)))) {
        this.container.find('button.applyBtn').removeAttr('disabled');
      } else {
        //this.container.find('button.applyBtn').attr('disabled', 'disabled');
      }

    },

    move: function () {
      var parentOffset = {top: 0, left: 0},
          containerTop;
      var parentRightEdge = $(window).width();
      if (!this.parentEl.is('body')) {
        parentOffset = {
          top:  this.parentEl.offset().top - this.parentEl.scrollTop(),
          left: this.parentEl.offset().left - this.parentEl.scrollLeft()
        };
        parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
      }

      if (this.drops == 'up') {
        containerTop = this.element.offset().top - this.container.outerHeight() - parentOffset.top;
      } else {
        containerTop = this.element.offset().top + this.element.outerHeight() - parentOffset.top;
      }
      this.container[this.drops == 'up' ? 'addClass' : 'removeClass']('dropup');

      if (this.opens == 'left') {
        this.container.css({
          top:   containerTop,
          right: parentRightEdge - this.element.offset().left - this.element.outerWidth(),
          left:  'auto'
        });
        if (this.container.offset().left < 0) {
          this.container.css({
            right: 'auto',
            left:  9
          });
        }
      } else if (this.opens == 'center') {
        this.container.css({
          top:   containerTop,
          left:  this.element.offset().left - parentOffset.left + this.element.outerWidth() / 2
                 - this.container.outerWidth() / 2,
          right: 'auto'
        });
        if (this.container.offset().left < 0) {
          this.container.css({
            right: 'auto',
            left:  9
          });
        }
      } else {
        this.container.css({
          top:   containerTop,
          left:  this.element.offset().left - parentOffset.left,
          right: 'auto'
        });
        if (Math.round(this.container.offset().left) + Math.round(this.container.outerWidth()) > $(window).width()) {
          this.container.css({
            left:  'auto',
            right: 0
          });
        }
      }
    },

    show: function (e) {
      if (this.isShowing) {
        return;
      }

      // Create a click proxy that is private to this instance of datepicker, for unbinding
      this._outsideClickProxy = $.proxy(function (e) {
        this.outsideClick(e);
      }, this);

      // Bind global datepicker mousedown for hiding and
      $(document)
        .on('mousedown.daterangepicker', this._outsideClickProxy)
        // also support mobile devices
        .on('touchend.daterangepicker', this._outsideClickProxy)
        // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
        .on('click.daterangepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
        // and also close when focus changes to outside the picker (eg. tabbing between controls)
        .on('focusin.daterangepicker', this._outsideClickProxy);

      // Reposition the picker if the window is resized while it's open
      $(window).on('resize.daterangepicker', $.proxy(function (e) {
        this.move(e);
      }, this));

      if (this.startDate) {
        this.oldStartDate = this.startDate.clone();
      }

      if (this.endDate) {
        this.oldEndDate = this.endDate.clone();
      }

      this.updateView();
      this.container.show();
      this.move();
      this.element.trigger('show.daterangepicker', this);
      this.isShowing = true;
    },

    hide: function (e) {

      if (!this.isShowing) {
        return;
      }

      //incomplete date selection, revert to last values
      /*if (!this.endDate) {
          this.startDate = this.oldStartDate.clone();
          this.endDate = this.oldEndDate.clone();
      }*/

      //if a new date range was selected, invoke the user callback function
      this.callback(this.startDate, this.endDate, this.chosenLabel);

      //if picker is attached to a text input, update it
      this.updateElement();

      $(document).off('.daterangepicker');
      $(window).off('.daterangepicker');
      this.container.hide();
      this.element.trigger('hide.daterangepicker', this);
      this.isShowing = false;
    },

    toggle: function (e) {
      if (this.isShowing) {
        this.hide();
      } else {
        this.show();
      }
    },

    outsideClick: function (e) {
      var target = $(e.target),
          currentDateRangeTypeId = _.get(this.ranges[this.chosenLabel], 'dateRangeTypeId');

      this.chosenDateRangeTypeId = currentDateRangeTypeId;

      // if the page is clicked anywhere except within the daterangerpicker/button
      // itself then call this.hide()
      if (
        // ie modal dialog fix
      e.type == "focusin" ||
      target.closest(this.element).length ||
      target.closest(this.container).length ||
      target.closest('.calendar-table').length
      ) {
        return;
      }
      this.hide();
    },

    showCalendars: function () {
      this.container.addClass('show-calendar');
      this.move();
      this.element.trigger('showCalendar.daterangepicker', this);
    },

    hideCalendars: function () {
      this.container.removeClass('show-calendar');
      this.element.trigger('hideCalendar.daterangepicker', this);
    },

    hoverRange: function (e) {

      //ignore mouse movements while an above-calendar text input has focus
      if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus")) {
        return;
      }

      var label = e.target.dataset.range || e.target.innerHTML;
      if (label == this.locale.customRangeLabel) {
        this.updateView();
      } else {
        var dates = this.ranges[label];

        if (dates[0]) {
          this.container.find('input[name=daterangepicker_start]').val(dates[0].format(this.locale.format));
          this.container.find('span.daterangepicker_start').html(dates[0].format(this.locale.format));

        } else {
          this.container.find('input[name=daterangepicker_start]').val("∞");
          this.container.find('span.daterangepicker_start').html("∞");
        }
        if (dates[1]) {
          this.container.find('input[name=daterangepicker_end]').val(dates[1].format(this.locale.format));
          this.container.find('span.daterangepicker_end').html(dates[1].format(this.locale.format));

        } else {
          this.container.find('input[name=daterangepicker_end]').val("∞");
          this.container.find('span.daterangepicker_end').html("∞");
        }
      }

    },

    clickRange: function (e) {
      var label = e.target.dataset.range || e.target.innerHTML,
          dateRangeTypeId = e.target.dataset.dateRangeTypeId;

      this.container.removeClass(this.chosenLabel);
      this.chosenLabel = label;
      this.chosenDateRangeTypeId = dateRangeTypeId;
      this.container.addClass(label);

      if (label == this.locale.customRangeLabel) {
        this.showCalendars();
        this.initial = true;
        this.setStartDate(moment().startOf('day'));
        this.endDate = null;
        this.container.find('.ranges li').removeClass('active');
        this.container.find('.ranges li:last-child').addClass('active');
        this.updateCalendars();
      } else {
        var dates = this.ranges[label];
        dates[0] ? this.setStartDate(dates[0].clone()) : this.startDate = null;
        dates[1] ? this.setEndDate(dates[1].clone()) : this.endDate = null;

        if (dates[0] && dates[0]._isValid) {
          this.leftCalendar.month = dates[0].clone();
          this.showCalendar('left');
        } else {
          this.showCalendar('right');
        }

        if (dates[1] && dates[1]._isValid) {
          this.rightCalendar.month = dates[1].clone();
        } else {
          this.showCalendar('left');
        }

        if (!this.timePicker) {
          if (this.startDate) {
            this.startDate.startOf('day');
          }
          if (this.endDate) {
            this.endDate.endOf('day');
          }
        }

        this.updateCalendars();
      }

      // custom range
      if (!e.target.dataset.range) {
        this.showCalendar('left');
      }

      this.updateFormInputs();
      this.updateRangeSelection();

    },

    clickPrev: function (e) {
      var cal = $(e.target).parents('.calendar');
      if (cal.hasClass('left')) {
        this.leftCalendar.month.subtract(1, 'month');
      } else {
        this.rightCalendar.month.subtract(1, 'month');
      }
      this.updateCalendars();
    },

    clickNext: function (e) {
      var cal = $(e.target).parents('.calendar');
      if (cal.hasClass('left')) {
        this.leftCalendar.month.add(1, 'month');
      } else {
        this.rightCalendar.month.add(1, 'month');
      }
      this.updateCalendars();
    },

    clickPrevYear: function (e) {
      var cal = $(e.target).parents('.calendar');
      if (cal.hasClass('left')) {
        this.leftCalendar.month.subtract(1, 'year');
      } else {
        this.rightCalendar.month.subtract(1, 'year');
      }
      this.updateCalendars();
    },

    clickNextYear: function (e) {
      var cal = $(e.target).parents('.calendar');
      if (cal.hasClass('left')) {
        this.leftCalendar.month.add(1, 'year');
      } else {
        this.rightCalendar.month.add(1, 'year');
      }
      this.updateCalendars();
    },

    hoverDate: function (e) {

      if (this.chosenLabel === 'after_date' || this.chosenLabel === 'before_date' || this.chosenLabel === 'specific_date') {
        return false;
      }

      //ignore mouse movements while an above-calendar text input has focus
      if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus")) {
        return;
      }

      //ignore dates that can't be selected
      if (!$(e.target).hasClass('available')) {
        return;
      }

      //have the text inputs above calendars reflect the date being hovered over
      var title = $(e.target).attr('data-title');
      var row = title.substr(1, 1);
      var col = title.substr(3, 1);
      var cal = $(e.target).parents('.calendar');
      var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

      /*
      if (this.endDate) {
          this.container.find('input[name=daterangepicker_start]').val(date.format(this.locale.format));
      } else {
          this.container.find('input[name=daterangepicker_end]').val(date.format(this.locale.format));
      }
      */

      //highlight the dates between the start date and the date being hovered as a potential end date
      var leftCalendar = this.leftCalendar;
      var rightCalendar = this.rightCalendar;
      var startDate = this.startDate;
      if (!this.endDate) {
        this.container.find('.calendar td').each(function (index, el) {

          //skip week numbers, only look at dates
          if ($(el).hasClass('week')) {
            return;
          }

          if (title) {

            var title = $(el).attr('data-title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(el).parents('.calendar');
            var dt = cal.hasClass('left') ? leftCalendar.calendar[row][col] : rightCalendar.calendar[row][col];

            if (dt.isAfter(startDate) && dt.isBefore(date)) {
              $(el).addClass('in-range');
            } else {
              $(el).removeClass('in-range');
            }

          }

        });
      }

    },

    clickDate: function (e) {

      if (!$(e.target).hasClass('available') ||
        (this.chosenLabel === 'specific_date') && $(e.target).parents('.calendar').hasClass('right')) {
        return;
      }

      var title = $(e.target).attr('data-title');
      var row = title.substr(1, 1);
      var col = title.substr(3, 1);
      var cal = $(e.target).parents('.calendar');
      var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

      //
      // this function needs to do a few things:
      // * alternate between selecting a start and end date for the range,
      // * if the time picker is enabled, apply the hour/minute/second from the select boxes to the clicked date
      // * if autoapply is enabled, and an end date was chosen, apply the selection
      // * if single date picker mode, and time picker isn't enabled, apply the selection immediately
      //

      // left calendar for startdate, right calendar for enddate
      if ($(e.target).parents('.calendar').hasClass('left')) {
        if (this.timePicker) {
          var hour = parseInt(this.container.find('.time.left .hourselect').val(), 10) || 0;
          if (!this.timePicker24Hour) {
            var ampm = this.container.find('.time.left .ampmselect').val();
            if (ampm === 'PM' && hour < 12) {
              hour += 12;
            }
            if (ampm === 'AM' && hour === 12) {
              hour = 0;
            }
          }
          var minute = parseInt(this.container.find('.time.left .minuteselect').val(), 10) || 0;
          var second = this.timePickerSeconds ? parseInt(this.container.find('.time.left .secondselect').val(), 10) : 0 || 0;

          date = date.clone().hour(hour).minute(minute).second(second);
        }
        this.setStartDate(date.clone());

        if (this.endDate && this.startDate > this.endDate) {
          this.endDate = null;
        }

      } else {

        if (this.timePicker) {
          var hour = parseInt(this.container.find('.time.right .hourselect').val(), 10) || 0;
          if (!this.timePicker24Hour) {
            var ampm = this.container.find('.time.right .ampmselect').val();
            if (ampm === 'PM' && hour < 12) {
              hour += 12;
            }
            if (ampm === 'AM' && hour === 12) {
              hour = 0;
            }
          }
          var minute = parseInt(this.container.find('.time.right .minuteselect').val(), 10) || 0;
          var second = this.timePickerSeconds ? parseInt(this.container.find('.time.right .secondselect').val(), 10) : 0 || 0;
          date = date.clone().hour(hour).minute(minute).second(second);
        }

        this.setEndDate(date.clone());

        if (this.autoApply) {
          this.clickApply();
        }
      }

      if (this.singleDatePicker || this.singleDateAndTime) {
        if (this.endDate) {
          this.endDate.dayOfYear(this.startDate.clone().dayOfYear()).endOf('day');
        } else {
          this.setEndDate(this.startDate.clone().endOf('day'));
        }
      }

      this.updateView();
      this.initial = false;

    },

    clickApply: function (e) {
      this.hide();
      this.element.trigger('apply.daterangepicker', this);
    },

    clickReset: function () {
      this.setStartDate(moment());
      this.endDate = null;
      this.updateView();
    },

    clickCancel: function (e) {
      this.startDate = this.oldStartDate;
      this.endDate = this.oldEndDate;
      this.hide();
      this.element.trigger('cancel.daterangepicker', this);
    },

    monthOrYearChanged: function (e) {
      var isLeft      = $(e.target).closest('.calendar').hasClass('left'),
          leftOrRight = isLeft ? 'left' : 'right',
          cal         = this.container.find('.calendar.' + leftOrRight);

      // Month must be Number for new moment versions
      var month = parseInt(cal.find('.monthselect').val(), 10);
      var year = cal.find('.yearselect').val();

      if (!isLeft) {
        if (year < this.startDate.year() || (year == this.startDate.year() && month < this.startDate.month())) {
          month = this.startDate.month();
          year = this.startDate.year();
        }
      }

      if (this.minDate) {
        if (year < this.minDate.year() || (year == this.minDate.year() && month < this.minDate.month())) {
          month = this.minDate.month();
          year = this.minDate.year();
        }
      }

      if (this.maxDate) {
        if (year > this.maxDate.year() || (year == this.maxDate.year() && month > this.maxDate.month())) {
          month = this.maxDate.month();
          year = this.maxDate.year();
        }
      }

      if (isLeft) {
        this.leftCalendar.month.month(month).year(year);
        if (this.linkedCalendars) {
          this.rightCalendar.month = this.leftCalendar.month.clone().add(1, 'month');
        }
      } else {
        this.rightCalendar.month.month(month).year(year);
        if (this.linkedCalendars) {
          this.leftCalendar.month = this.rightCalendar.month.clone().subtract(1, 'month');
        }
      }
      this.updateCalendars();
    },

    timeChanged: function (e) {

      var cal    = $(e.target).closest('.time'),
          isLeft = cal.hasClass('left');

      var hour = parseInt(cal.find('.hourselect').val(), 10);
      var minute = parseInt(cal.find('.minuteselect').val(), 10);
      var second = this.timePickerSeconds ? parseInt(cal.find('.secondselect').val(), 10) : 0;

      if (!this.timePicker24Hour) {
        var ampm = cal.find('.ampmselect').val();
        if (ampm === 'PM' && hour < 12) {
          hour += 12;
        }
        if (ampm === 'AM' && hour === 12) {
          hour = 0;
        }
      }

      if (isLeft) {
        var start = this.startDate.clone();
        start.hour(hour);
        start.minute(minute);
        start.second(second);
        this.setStartDate(start);
        if (this.endDate && this.endDate.format('YYYY-MM-DD') == start.format('YYYY-MM-DD') && this.endDate.isBefore(start)) {
          this.setEndDate(start.clone());
        }
      } else if (this.endDate) {
        var end = this.endDate.clone();
        end.hour(hour);
        end.minute(minute);
        end.second(second);
        this.setEndDate(end);
      }

      //update the calendars so all clickable dates reflect the new time component
      this.updateCalendars();

      //update the form inputs above the calendars with the new time
      this.updateFormInputs();

      //re-render the time pickers because changing one selection can affect what's enabled in another
      this.renderTimePicker('left');
      this.renderTimePicker('right');


    },

    nowButton: function () {
      if (this.startDateSelected) {
        this.setStartDate(moment());

      } else {
        this.setEndDate(moment());
      }

      this.updateView();

    },

    formInputsChanged: function (e) {
      var isRight = $(e.target).closest('.calendar').hasClass('right');
      var start = moment(this.container.find('input[name="daterangepicker_start"]').val(), this.locale.format);
      var end = moment(this.container.find('input[name="daterangepicker_end"]').val(), this.locale.format);

      if (start.isValid() && end.isValid()) {

        if (isRight && end.isBefore(start)) {
          start = end.clone();
        }

        this.setStartDate(start);
        this.setEndDate(end);

        if (isRight) {
          this.container.find('input[name="daterangepicker_start"]').val(this.startDate.format(this.locale.format));
        } else {
          this.container.find('input[name="daterangepicker_end"]').val(this.endDate.format(this.locale.format));
        }

      }

      this.updateCalendars();
      if (this.timePicker) {
        this.renderTimePicker('left');
        this.renderTimePicker('right');
      }
    },

    elementChanged: function () {
      if (!this.element.is('input')) {
        return;
      }
      if (!this.element.val().length) {
        return;
      }
      if (this.element.val().length < this.locale.format.length) {
        return;
      }

      var dateString = this.element.val().split(this.locale.separator),
          start      = null,
          end        = null;

      if (dateString.length === 2) {
        start = moment(dateString[0], this.locale.format);
        end = moment(dateString[1], this.locale.format);
      }

      if (this.singleDatePicker || this.singleDateAndTime || start === null || end === null) {
        start = moment(this.element.val(), this.locale.format);
        end = start;
      }

      if (!start.isValid() || !end.isValid()) {
        return;
      }

      this.setStartDate(start);
      this.setEndDate(end);
      this.updateView();
    },

    keydown: function (e) {
      //hide on tab or enter
      if ((e.keyCode === 9) || (e.keyCode === 13)) {
        this.hide();
      }
    },

    updateElement: function () {
      if (this.element.is('input') && !this.singleDatePicker && !this.singleDateAndTime && this.autoUpdateInput) {
        this.element.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
        this.element.trigger('change');
      } else if (this.element.is('input') && this.autoUpdateInput) {
        this.element.val(this.startDate.format(this.locale.format));
        this.element.trigger('change');
      }
    },

    remove: function () {
      this.container.remove();
      this.element.off('.daterangepicker');
      this.element.removeData();
    }

  };

  $.fn.daterangepicker = function (options, callback) {
    this.each(function () {
      var el = $(this);
      if (el.data('daterangepicker')) {
        el.data('daterangepicker').remove();
      }
      el.data('daterangepicker', new DateRangePicker(el, options, callback));
    });
    return this;
  };

}));
