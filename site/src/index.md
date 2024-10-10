---
toc: false
---

<hgroup>
  <img alt="The MarketChef logo; i.e., a muscular bull wearing a chef's hat" src="marketchef.svg">
  <h1>MarketChef</h1>
  <h2>Let investors cook</h2>
  <p>
    A collection of simple tools and applications (recipes) for the
    data-fetish retail investor.
  </p>
</hgroup>

<style>

hgroup {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  text-align: center;

  & img {
    height: 10em;
  }

  & h1 {
    font-size: clamp(2em, 15vw, 6em);
    font-weight: 900;
    max-width: none;

    background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  & h2 {
    color: var(--theme-foreground-muted);
    font-size: clamp(0.8em, 5vw, 1.5em);
    font-style: initial;
    font-weight: 600;
  }

  & p {
    margin-top: 2em;
    max-width: 40ch;
  }
}

</style>
