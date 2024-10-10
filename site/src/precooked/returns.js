import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import _ from "npm:lodash";

/**
 * Computes the rolling returns for the given dataset of daily prices.
 *
 * The i-th return represents buying on the (i - period)-th moment and selling
 * on the i-th moment:
 *
 *     Return[i] = Price[i - period] / Price[i] - 1
 *
 * Note that this could have been achieved using Plot.windowY:
 *
 *     Plot.windowY(
 *       {
 *         k: period + 1,
 *         anchor: "end",
 *         strict: true,
 *         reduce: (i, d) => d[i[i.length - 1]] / d[i[0]] - 1,
 *       },
 *       {
 *         x: "Date",
 *         y: "Price",
 *         stroke: "Symbol",
 *         interval: "day",
 *         tip: {
 *           format: {
 *             x: (x) => `${d3.utcFormat("%Y-%m-%d")(x - 86_400_000 * period)} — ${d3.utcFormat("%Y-%m-%d")(x)}`,
 *           },
 *         },
 *       },
 *     ),
 *
 * Though performance wasn't great, so here's the old school approach...
 *
 * @param {{Date: Date; Price: number; Symbol: string}[]} prices
 * @param {number} period
 * @returns {{Date: Date; Return: number; Symbol: string}[]}
 */
export function dailyPrices2rollingReturns(prices, period) {
  if (!Number.isInteger(period) || period < 1) {
    throw new Error("period must be a positive integer", { cause: { period } });
  }

  const groups = _.groupBy(prices, "Symbol");

  const returns = {};

  Object.entries(groups).forEach(([symbol, prices]) => {
    if (period >= prices.length) {
      throw new Error("period too large", {
        cause: { period, symbol, prices },
      });
    }

    returns[symbol] = Array.from(new Array(prices.length - period), (_, i) => ({
      Return: prices[i + period].Price / prices[i].Price - 1,
      Date: prices[i + period].Date,
    }));
  });

  return _.flatMap(Object.keys(returns), (s) =>
    returns[s].map((data) => ({
      ...data,
      Symbol: s,
    })),
  );
}

/**
 * @param {{Date: Date; Price: number; Symbol: string}[]} prices
 * @param {number} period
 * @param {{width: number}} options
 * @returns {Plot.plot}
 */
export function chartRollingReturns(prices, period, { width }) {
  const returns = dailyPrices2rollingReturns(prices, period);
  return Plot.plot({
    width,
    title: `Rolling returns at ${Math.floor(period / 365)} years and ${period % 365} days`,
    y: {
      percent: true,
      grid: true,
      tickFormat: d3.format("+d"),
    },
    color: { legend: true },
    marks: [
      Plot.ruleY([0]),
      Plot.lineY(returns, {
        x: "Date",
        y: "Return",
        z: "Symbol",
        stroke: "Symbol",
        interval: "day",
        tip: {
          format: {
            x: (x) =>
              `${d3.utcFormat("%Y-%m-%d")(x - 86_400_000 * period)} — ${d3.utcFormat("%Y-%m-%d")(x)}`,
          },
        },
      }),
    ],
  });
}

/**
 * @param {{Date: Date; Price: number; Symbol: string}[]} prices
 * @param {number} period
 * @param {{width: number; cumulative: boolean}} options
 * @returns {Plot.plot}
 */
export function chartRollingReturnsDistribution(
  prices,
  period,
  { width, cumulative },
) {
  const returns = dailyPrices2rollingReturns(prices, period);
  const mark = cumulative ? Plot.areaY : Plot.rectY;
  return Plot.plot({
    width,
    title: `Rolling returns ${cumulative ? "reverse cumulative distribution" : "distribution"} at ${Math.floor(period / 365)} years and ${period % 365} days`,
    y: { percent: true },
    x: { percent: true },
    color: { legend: true },
    marks: [
      Plot.ruleY([0]),
      mark(
        returns,
        Plot.mapY(
          (counts) => counts,
          Plot.binX(
            {
              y: "proportion-facet",
            },
            {
              x: "Return",
              fy: "Symbol",
              fill: "Symbol",
              thresholds: 100,
              cumulative: cumulative ? -1 : 0,
              tip: {
                format: {
                  x: cumulative
                    ? (x) => `${d3.format("+.2f")(x)} or more`
                    : d3.format("+.2f"),
                },
              },
            },
          ),
        ),
      ),
    ],
  });
}
