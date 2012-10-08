var chart;

jQuery(document).ready(function(){
	createGraph();
});

updateCallback = function() {
	chart.destroy();
	createGraph();
};

function createGraph() {
    if(data.nPopupClicked <= 0) {
        $("#popupTimes").hide();
    } else {
        $("#popupTimes").text(_getMessage("timesUsed", data.nPopupClicked));
    }
    if(data.nCookiesCreated <= 0 && data.nCookiesChanged <= 0 && data.nCookiesDeleted <= 0 && data.nCookiesProtected <= 0 && data.nCookiesFlagged <= 0 && data.nCookiesShortened <= 0) {
        $(".notice", "").show();
        return;
    }
	
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'piechart',
            defaultSeriesType: 'bar',
            marginRight: 250,
            marginLeft: 10,
            plotBackgroundColor: "#FFF",
            backgroundColor: "#FFF",
            plotBorderWidth: null,
            plotShadow: true
        },
        title: {
            text: _getMessage("statsSince",new Date(data.startStatsDate).toLocaleDateString())
        },
        xAxis: {
            categories: [''],
            title: {
                text: null
            }

        },
        yAxis: {
            min: 0,
            title: {
                text: '',
                align: 'high'
            },
            labels: {
                formatter: function() {
                    return null;
                }
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            x: 0,
            y: 0,
            floating: false,
            borderWidth: 0,
            shadow: false
        },
        tooltip: {
            formatter: function() {
                return this.series.name + ': ' + Math.round(Math.pow(10,this.y) - 1);
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        var toRet = Math.round(Math.pow(10,this.y) - 1);
                        return (toRet == 0) ? null : toRet; 
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            'data':[log10(data.nCookiesCreated)],
            'name':_getMessage("cookiesCreated")
        },

        {
            'data':[log10(data.nCookiesChanged)],
            'name':_getMessage("cookiesModified")
        },

        {
            'data':[log10(data.nCookiesDeleted)],
            'name':_getMessage("cookiesDeleted")
        },

        {
            'data':[log10(data.nCookiesProtected)],
            'name':_getMessage("cookiesProtected")
        },

        {
            'data':[log10(data.nCookiesFlagged)],
            'name':_getMessage("cookiesFlagged")
        },
        {
            'data':[log10(data.nCookiesShortened)],
            'name':_getMessage("cookiesShortened")
        },
        {
            'data':[log10(data.nCookiesExported)],
            'name':_getMessage("cookiesExported")
        },
        {
            'data':[log10(data.nCookiesImported)],
            'name':_getMessage("cookiesImported")
        }]

    });
}

function log10(n) {
    return Math.log(n+1)/Math.log(10);   
}
