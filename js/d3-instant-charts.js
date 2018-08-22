/*!
 * D3 Instant Charts 0.1
 *
 * https://github.com/forink/D3-Instant-Charts
 *
 * Depends on jquery 3.x and D3.js v5 library
 *
 * Copyright (c) 2018 Yifong Jiang
 * Released under the BSD 2-clause License.
 */

/*eslint no-extra-parens: [2, "functions"]*/

(function ($) {
    "use strict";
    var defaults = {
    };

    $.fn.barChart = function (options) {

        // Default options
        var settings = $.extend({
            jsonUrl: '',
            useClientSize: false,  //This plugin will detect the client size to autofit the svg size.
            width: 400,  //svg width
            height: 300,  //svg height
            marginTop: 30,  //svg margin top
            marginRight: 30,  //svg margin right
            marginButtom: 30,  //svg margin buttom
            marginLeft: 80,  //svg margin left
            barSpacing: 0.1,  //設定Bar間距
            barWidthRate: 0.3,  //設定Bar寬比率 (0~1，數字越小越粗)
            axisXScaleCount: 10,  //X軸刻度數量
            toolTipFormat: '{%name%} - {%value%}'
        }, options);

        var targetId = $(this).attr("id");
        var jsonObj = callJson(settings.jsonUrl);
        //console.log(jsonObj.ChartData);

        if (jsonObj === null || jsonObj === 'ERROR') { return; }

        //設定畫布邊界
        var margin = {
            top: settings.marginTop,
            right: settings.marginRight,
            bottom: settings.marginButtom,
            left: settings.marginLeft
        };

        //設定畫布大小
        var svgWidth, svgHeight;
        if (settings.useClientSize) {
            svgWidth = document.querySelector('#' + targetId).clientWidth;
            svgHeight = document.querySelector('#' + targetId).clientHeight;
        } else {
            svgWidth = settings.width;
            svgHeight = settings.height;
        }

        //設定圖表大小
        var chartWidth = svgWidth - (margin.left + margin.right);
        var chartHeight = svgHeight - (margin.top + margin.bottom);

        //建立圖框
        var svg = d3.select('#' + targetId)
            .append('svg')
            .attr('class', 'd3-instant-charts')
            .attr('width', svgWidth)
            .attr('height', svgHeight);

        //建立坐標軸圖層
        var axisLayer = svg.append("g")
            .classed("axisLayer", true)
            .attr("width", svgWidth)
            .attr("height", svgHeight);

        //建立主圖表圖層
        var chartLayer = svg.append("g")
            .classed("chartLayer", true)
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("transform", "translate(" + [margin.left, margin.top] + ")");

        //設定資料Root
        var dataset = jsonObj.ChartData;

        //取得資料最大值
        var maxDataVal = d3.max(dataset, function (d) { return d.value; });

        //刻度值
        var tickVal = d3.tickStep(0, maxDataVal, settings.axisXScaleCount);

        //計算出X軸最大值
        var axisXMaxVal = (tickVal - (maxDataVal % tickVal)) + maxDataVal;

        //設定X軸尺度
        var xScale = d3.scaleLinear()
            .domain([0, axisXMaxVal])
            .range([0, chartWidth]);

        //設定Y軸尺度
        var yScale = d3.scaleBand()
            .rangeRound([0, chartHeight])
            .padding(settings.barSpacing)
            .domain(dataset.map(function (d) { return d.name; }))
            .paddingInner(settings.barWidthRate);

        //繪製 X Grid
        var gridX = axisLayer.append('g')
            .attr('class', 'grid-x')
            .attr('transform', 'translate(' + margin.left + ',' + (chartHeight + margin.top) + ')')
            .call(d3.axisBottom(xScale)
                .ticks()
                .tickSizeInner(-chartHeight)
                .tickFormat("")
            );

        //繪製X軸
        var axisX = axisLayer.append('g')
            .attr('class', 'axis-x')
            .attr('transform', 'translate(' + margin.left + ',' + (chartHeight + margin.top) + ')')
            .call(d3.axisBottom(xScale)
                .ticks()
            );

        //繪製Y軸
        var axisY = axisLayer.append('g')
            .attr('class', 'axis-y')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .call(d3.axisLeft(yScale));

        //滑鼠移過時的Tooltip區塊
        var tooltip = d3.select('body').append('div')
            .attr('class', 'd3-instant-charts-tooltip');

        //建立長條圖POOL
        var gs = chartLayer.append('g')
            .selectAll('rect')
            .data(dataset)
            .enter()
            .append('g');

        //繪製長條圖 (含滑鼠移過時的Tooltip)
        gs.append('rect')
            .attr('x', 2)
            .attr('y', function (d) { return (yScale(d.name)); })
            .attr('class', 'bar')
            .attr('height', yScale.bandwidth())
            .on('mouseover', function (d) {
                tooltip.transition().duration(200)
                    .style('opacity', 0.8);
                tooltip.html(String(settings.toolTipFormat)
                        .replace("{%name%}", d.name)
                        .replace("{%value%}", d.value))
                    .style('left', (d3.event.pageX) + 'px')
                    .style('top', (d3.event.pageY - 28) + 'px');
                d3.select(this)
                    .style('fill', '#3379c4')
                    .style('stroke-width', '2px')
                    .attr('x', 3)
                    .attr('width', function (d) {
                        return xScale(d.value) - 2;
                    });
            })
            .on('mousemove', function () {
                return tooltip
                    .style('top', (d3.event.pageY - 10) + 'px')
                    .style('left', (d3.event.pageX + 10) + 'px');
            })
            .on('mouseout', function (d) {
                tooltip
                    .transition()
                    .duration(500)
                    .style('opacity', 0);
                d3.select(this)
                    .style('fill', '#65a7ef')
                    .style('stroke-width', '0')
                    .attr('x', 2)
                    .attr('width', function (d) {
                        return xScale(d.value);
                    });
            })
            .transition()
            .duration(1200)
            .attr('width', function (d) {
                return xScale(d.value);
            });

        //Bar後面的文字
        /*
        gs.append('text')
            .attr('class', 'bar-text')
            .attr('x', padding.left)
            .attr('y', function (d) { return yScale(d.name); })
            .attr('dx', 5)
            .attr('dy', ((yScale.bandwidth()) / 2)+4)
            .text(function (d) {
                return d.value;
            })
            .transition()
            .duration(1200)
            .attr('x', function (d) {
                return xScale(d.value);
            })
            */

        /*************************************/
    };

    //$.fn.columnChart = function (options) {};

    //$.fn.dataBar = function (options) {};

    $.fn.lineChart = function (options) {

        // Default options
        var settings = $.extend({
            name: 'John Doe',
            color: 'orange'
        }, options);

        // Apply options
        //this.append(testA());
    };

    //$.fn.areaChart = function (options) { };

    //$.fn.pieChart = function (options) {};

    //$.fn.radarChart = function (options) { };

    //$.fn.gaugeChart = function (options) {};

    var testA = function () {
        return 'Hello ' + defaults.holidayColor + '!';
    };

    //Get json data from url
    var callJson = function (url) {

        var jsonData = '';

        $.ajax({
            url: url,
            type: 'GET',
            async: false,
            dataType: 'json',
            success: function (data) {
                jsonData = data;
            },
            error: function () {
                jsonData = 'ERROR';
            }
        });
        //console.log(jsonData);
        return jsonData;
    };

}(jQuery));