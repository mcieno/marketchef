import * as d3 from "npm:d3";
import _ from "npm:lodash";

const CACHE_EXPIRES_AFTER = 86_400_000 * 7;
const CACHE_NAME = "mktchf-yf";

/**
 * @param {string} ticker
 * @returns {Promise<Record<string, any> | null>}
 */
async function fetchTickerDataFromYahooFinance(ticker) {
  const cache = await caches.open(CACHE_NAME);

  // Custom endpoint because CORS
  const endpoint =
    "/api/yf?" +
    new URLSearchParams({ ticker: ticker.toUpperCase() }).toString();

  let response = await cache.match(endpoint);
  const expiry =
    new Date(response?.headers.get("date") || 0).getTime() +
    CACHE_EXPIRES_AFTER;
  if (new Date() > expiry) {
    try {
      response = await fetch(endpoint);
    } catch (error) {
      if (!response) {
        throw error;
      }
      // It's better to serve outdated data then than throwing an error.
      console.error(error);
    }
  }

  const data = await response.clone().json(); // Clone to make it cacheable

  if (data.chart.error !== null) {
    return null;
  }

  if (data.chart.result?.length !== 1) {
    return null;
  }

  if (data.chart.result[0].timestamp.length === 0) {
    return null;
  }

  await cache.put(endpoint, response);

  return data;
}

/**
 * Downloads historical prices for the given ticker from Yahoo Finance.
 *
 * @param {string} ticker
 */
export async function download(tickers) {
  /** @type {(Record<string, number> & {Date: Date})[]} */
  const csv = [];
  csv.__proto__.columns = ["Date"];

  for (const ticker of tickers) {
    const data = await fetchTickerDataFromYahooFinance(ticker);
    if (data === null) {
      continue;
    }

    const symbol = data.chart.result[0].meta.symbol;
    csv.columns.push(symbol);

    data.chart.result[0].timestamp.forEach((t, k) => {
      const date = new Date(d3.utcFormat("%Y-%m-%d")(t * 1_000));

      let index = csv.findIndex(
        ({ Date }) => Date.getTime() === date.getTime(),
      );
      if (index === -1) {
        index = csv.push({ Date: date }) - 1;
      }

      csv[index][symbol] =
        data.chart.result[0].indicators.adjclose[0].adjclose[k];
    });
  }

  _.remove(csv, (row) =>
    csv.columns
      .map((k) => row[k])
      .some((v) => v === null || v === undefined || isNaN(v)),
  );
  return _.orderBy(csv, ["Date"]);
}
