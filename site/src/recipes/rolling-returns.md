---
title: Rolling returns
---

# Rolling returns

This recipe visualizes the **distribution of rolling returns** given a time
series of daily prices.

Rolling returns are useful for examining the behavior of an asset given some
holding periods.

## Input

```js
const data = Mutable([]);
const setData = (value) => (data.value = value);
```

The simulation is prefilled with a
${html`<a href=${await attachedFile.url()} target="\_blank">default dataset</a>`}
containing the _S&P 500_ and the _MSCI World_ indices.

```js
const attachedFile = FileAttachment("/ingredients/sp500-and-msci-world.csv");
```

```js
setData(attachedFile.csv({ typed: true }));
```

You can override that at any time by uploading a CSV file formatted as follows:

```csv
Date,Asset 1,Asset 2,etc...
YYYY-MM-DD,123.45,67.89,etc...
```

```js
const uploadedFile = view(
  Inputs.file({
    label: "Custom CSV file",
    accept: ".csv",
    required: true,
  }),
);
```

```js
setData(uploadedFile.csv({ typed: true }));
```

... or simply choose some [Yahoo Finance](https://finance.yahoo.com/lookup/) tickers:

```js
const tickers = view(
  Inputs.form([
    Inputs.text({
      placeholder: "e.g.: ^GSPC",
    }),
    Inputs.text({
      placeholder: "e.g.: ^STOXX",
    }),
    Inputs.text({
      placeholder: "e.g.: VOO",
    }),
    Inputs.text({
      placeholder: "e.g.: SWDA.MI",
    }),
    Inputs.text({
      placeholder: "e.g.: AAPL",
    }),
  ]),
);
```

```js
import { download } from "/precooked/yf.js";
view(
  Inputs.button("Fetch from Yahoo Finance", {
    value: null,
    reduce: async () => setData(await download(_.filter(tickers))),
  }),
);
```

<div class="grid grid-cols-1">
  <div class="card">
  <h2>Dataset preview</h2>

```js
view(
  Inputs.table(data, {
    select: false,
  }),
);
```

  </div>
</div>

## Historical prices

```js
import { csv2dailyPrices } from "/precooked/prices.js";
const { prices: originalPrices, size: originalSize } = csv2dailyPrices(data);
```

This section allows you to filter out data that in your opinion is either
_too old_ or _too recent_.

<div class="warning">
Deliberately excluding data from the simulation is a form of cherry picking.
Careful or you might end up overfitting the statistics and lying to yourself.
</div>

```js
const dropOld = view(
  Inputs.range([0, Math.max(0, originalSize - 2)], {
    width,
    value: 0,
    step: 1,
    label: "Start from day",
  }),
);
```

```js
const dropNew = view(
  Inputs.range(
    [
      Math.max(0, Math.min(dropOld + 2, originalSize - 1)),
      Math.max(0, originalSize - 1),
    ],
    {
      width,
      value: originalSize,
      step: 1,
      label: "Stop at day",
    },
  ),
);
```

```js
const prices = _.flatMap(_.groupBy(originalPrices, "Symbol"), (d) =>
  d.slice(dropOld, dropNew + 1),
);
const size = dropNew - dropOld;
```

```js
let normalize = view(Inputs.toggle({ label: "Normalize prices", value: true }));
```

```js
import { chartHistory } from "/precooked/prices.js";
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => chartHistory(prices, { width, normalize }))}
  </div>
</div>

## Returns

Given a rolling window of size ${tex`T`}, let's simulate buying on day ${tex`d - T`}
and selling on day ${tex`d`} for every possible day:

```tex
\text{RollingReturns}(d, T) = \frac{\text{Price}(d - T)}{\text{Price}(d)} - 1
```

```js
const period = view(
  Inputs.range([1, Math.max(1, size - 2)], {
    width,
    value: Math.min(parseInt(size / 2), 365 * 5),
    step: 1,
    label: "Rolling window size",
  }),
);
```

```js
import { chartRollingReturns } from "/precooked/returns.js";
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => chartRollingReturns(prices, period, { width }))}
  </div>
</div>

## Probability distribution

Let's now use the set of profits/losses to compute a probability distribution of
the expected returns after holding for
${Math.floor(period / 365)} years and ${period % 365} days.

```js
let cumulative = view(Inputs.toggle({ label: "Cumulative", value: false }));
```

```js
import { chartRollingReturnsDistribution } from "/precooked/returns.js";
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => chartRollingReturnsDistribution(prices, period, { width, cumulative }))}
  </div>
</div>
