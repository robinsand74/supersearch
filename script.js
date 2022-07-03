// this script offers search engines based on the available data

// process single parameters in various ways
const processors = {
  safe: (q) => encodeURI(q),
  verbatim: (q) => q,
};
// join multiple parameters in various ways
const joiners = {
  ampersand: (qs) => qs.join("&"),
  dork: (qs) => qs.join("+"),
};

// engines
const engineTemplate = {
  join: joiners.dork,
  handlers: {
    name: processors.verbatim,
    email: processors.verbatim,
    domain: processors.verbatim,
    place: processors.verbatim,
  },
};
const engines = {
  Bing: { ...engineTemplate, url: "https://www.bing.com/search?q=" },
  DuckDuckGo: { ...engineTemplate, url: "https://duckduckgo.com/?q=" },
  GeoHack: {
    url: "https://geohack.toolforge.org/geohack.php?",
    join: joiners.ampersand,
    handlers: {
      // place: (q) => `pagename=${q}`,
      geo: (q) => `params=${q}`,
    },
  },
  Google: { ...engineTemplate, url: "https://www.google.com/search?q=" },
  "Google Maps": {
    url: "https://www.google.com/maps/@?api=1&",
    join: joiners.ampersand,
    handlers: { geo: (q) => `query=${q}`, place: (q) => `place/${q}` },
  },
  ipcalc: {
    url: "https://ipcalc.info/index.php?submit=true&",
    handlers: { ip: (q) => `host=${q}` },
  },
  SunCalc: {
    url: "https://www.suncalc.org/#/",
    handlers: { geo: processors.verbatim },
  },
};

// pivot engines, so we can find them by the kind of queries they support
const handlers = Object.keys(engines).reduce((obj, key) => {
  const engine = engines[key];
  Object.keys(engine.handlers).forEach((h) => {
    if (obj[h]) {
      obj[h].push(key);
    } else {
      obj[h] = [key];
    }
  });
  return obj;
}, {});

// determine intersection (common values) of a list of arrays
const intersection = (arrays, initial) =>
  arrays.reduce((a, b) => a.filter((c) => b.includes(c)), initial);

// return a link for an engine and a set of queries
function engineLink(engineName, handlerNames, values) {
  const engine = engines[engineName];
  const params = handlerNames.map((name) =>
    engine.handlers[name](values[name])
  );

  var url = engine.url + (params.length > 1 ? engine.join(params) : params[0]);
  return `<a href="${url}">${engineName}</a>`;
}

// return links for selected engines
function selectionLinks(names, selection) {
  const values = names.reduce((obj, name) => {
    obj[name] = document.querySelector(`input#${name}`).value;
    return obj;
  }, {});

  return selection
    .map((engine) => engineLink(engine, names, values))
    .map((l) => `<li>${l}</li>`)
    .join("\n");
}

// handle changes in the inputs
function handleChange({ target }) {
  // update checkbox
  const checkbox = document.querySelector(
    `input[type='checkbox'][name='${target.name}']`
  );
  if (target != checkbox) {
    if (target.value) {
      checkbox.disabled = false;
      checkbox.checked = true;
    } else {
      checkbox.disabled = true;
    }
  }

  // select active queries
  const active = names.filter((n) => {
    const c = document.querySelector(`input[type='checkbox'][name='${n}']`);
    return !c.disabled && c.checked;
  });

  const selectedEngines = active.map((a) => handlers[a] || []);
  const selection = intersection(selectedEngines, Object.keys(engines));

  const searches = document.getElementById("searches");
  if (selection.length > 0) {
    searches.innerHTML = selectionLinks(active, selection);
  } else {
    searches.innerHTML = `No search engines for ${active}.`;
  }
}

// this is run after the page is loaded
function docReady() {
  document.getElementById("inputs").addEventListener("change", handleChange);

  // disable checkboxes by default
  document
    .querySelectorAll("input[type='checkbox']")
    .forEach((cb) => (cb.disabled = true));
}
// inputs
const names = ["name", "email", "domain", "ip", "place", "geo"];
