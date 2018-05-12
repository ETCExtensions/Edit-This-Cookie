$(document).ready(function () {
    setReadOnlyRules();
    setEvents();
});

var forceHideOperations = false;

updateCallback = function () {
    location.reload(true);
    return;

    setReadOnlyRules();
    setEvents();
};

function setEvents() {
    $('.cmd_delete').unbind().click(function () {
        if (!data.showAlerts || confirm(_getMessage("Alert_deleteRule") + "?")) {
            hideEditCommands();
            var index = $('.active').attr("index");
            forceHideOperations = true;
            $('.operations:visible').clearQueue();
            $('.operations:visible').fadeOut();
            $('.active').fadeOut(function () {
                forceHideOperations = false;
                deleteReadOnlyRule(index);
                location.reload(true);
                return;
            });
        }
    });

    $('.data_row').unbind().mouseover(function () {
        $('.active').removeClass('active');
        $(this).addClass('active');

        $('.operations').clearQueue();

        $('.operations:hidden').animate({
            top: $(this).position().top,
            left: $(this).position().left + 5,
        }, 0, function () {
            $('.operations:hidden').show('slide', 200);
        });

        $('.operations').animate({
            top: $(this).position().top,
            left: $(this).position().left + 5,
        }, 250);
    });

}


function setReadOnlyRules() {
    $('.table_row:not(.header, .template, #line_template)', '.table').detach();

    if (data.readOnly.length == 0) {
        var row = $("#no_rules").clone().removeClass('template');
        $(".table").append(row);
        return;
    }

    for (var i = 0; i < data.readOnly.length; i++) {
        try {
            var rule = data.readOnly[i];
            var domain = (rule.domain != undefined) ? rule.domain : "any";
            var name = (rule.name != undefined) ? rule.name : "any";
            var value = (rule.value != undefined) ? rule.value : "any";
            addRuleLine(domain, name, value, i);
        } catch (e) {
            console.error(e.message);
        }
    }
}

function addRuleLine(domain, name, value, index) {
    var line = $("#line_template").clone();
    $('.domain_field', line).empty().text(domain);
    $('.name_field', line).empty().text(name);
    $('.value_field', line).empty().text(value);
    line.attr('id', 'rule_n_' + index);
    line.attr('index', index);
    line.css('display', '');
    $(".table").append(line);
}

function hideEditCommands() {
    newRowVisible = false;
    $(".new_rule_operations").fadeOut();
    $(".new_row:not(.template)").fadeOut().detach();
}
