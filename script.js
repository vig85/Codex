const crops = [
  {
    id: "wheat",
    name: "Wheat",
    emoji: "🌾",
    cost: 12,
    reward: 26,
    growthSeconds: 20,
    description: "Reliable staple crop with a quick yield."
  },
  {
    id: "carrot",
    name: "Carrot",
    emoji: "🥕",
    cost: 18,
    reward: 42,
    growthSeconds: 35,
    description: "Crunchy roots that prefer a little patience."
  },
  {
    id: "pumpkin",
    name: "Pumpkin",
    emoji: "🎃",
    cost: 35,
    reward: 90,
    growthSeconds: 60,
    description: "Slow growing, but perfect for autumn festivals."
  }
];

const initialState = {
  coins: 100,
  seeds: 10,
  day: 1,
  selectedCropId: crops[0].id,
  plots: Array.from({ length: 15 }, () => ({ state: "empty" })),
  log: ["Welcome to Sprout Acres! Plant a crop to begin your cozy journey."]
};

const state = structuredClone(initialState);

const cropButtonsContainer = document.querySelector("#cropButtons");
const fieldElement = document.querySelector("#field");
const coinsElement = document.querySelector("#coins");
const seedsElement = document.querySelector("#seeds");
const dayElement = document.querySelector("#day");
const logElement = document.querySelector("#log");
const helpButton = document.querySelector("#helpButton");
const helpModal = document.querySelector("#helpModal");
const closeHelpButton = document.querySelector("#closeHelp");
const plotTemplate = document.querySelector("#plotTemplate");

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  if (mins <= 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

const addLogEntry = (message) => {
  state.log.unshift(`[Day ${state.day}] ${message}`);
  if (state.log.length > 40) {
    state.log.pop();
  }
  renderLog();
};

const selectCrop = (id) => {
  state.selectedCropId = id;
  renderCropButtons();
};

const getCropById = (id) => crops.find((crop) => crop.id === id);

const plantCrop = (plotIndex) => {
  const plot = state.plots[plotIndex];
  if (plot.state !== "empty") {
    addLogEntry("That plot is already in use.");
    return;
  }

  const crop = getCropById(state.selectedCropId);
  if (!crop) {
    addLogEntry("Choose a crop before planting.");
    return;
  }

  if (state.coins < crop.cost) {
    addLogEntry("Not enough coins for that crop.");
    return;
  }

  if (state.seeds <= 0) {
    addLogEntry("You need more seeds. Try harvesting crops to find some!");
    return;
  }

  state.coins -= crop.cost;
  state.seeds -= 1;
  state.plots[plotIndex] = {
    state: "growing",
    cropId: crop.id,
    plantedAt: Date.now(),
    readyAt: Date.now() + crop.growthSeconds * 1000
  };
  addLogEntry(`Planted ${crop.name} on plot ${plotIndex + 1}.`);
  renderStats();
  renderPlots();
};

const harvestCrop = (plotIndex) => {
  const plot = state.plots[plotIndex];
  if (plot.state !== "ready") {
    addLogEntry("This crop isn't ready yet.");
    return;
  }
  const crop = getCropById(plot.cropId);
  state.coins += crop.reward;
  state.seeds += Math.random() < 0.3 ? 2 : 1;
  state.plots[plotIndex] = { state: "empty" };
  addLogEntry(`Harvested ${crop.name} for ${crop.reward} coins!`);
  renderStats();
  renderPlots();
};

const updateGrowth = () => {
  const now = Date.now();
  state.plots = state.plots.map((plot) => {
    if (plot.state !== "growing") return plot;
    if (now >= plot.readyAt) {
      return { ...plot, state: "ready" };
    }
    return plot;
  });
  renderPlots();
};

const advanceDay = () => {
  state.day += 1;
  state.seeds += 1;
  addLogEntry("A new day dawns on Sprout Acres. Fresh seeds have arrived!");
  renderStats();
};

const renderStats = () => {
  coinsElement.textContent = state.coins;
  seedsElement.textContent = state.seeds;
  dayElement.textContent = state.day;
};

const renderLog = () => {
  logElement.innerHTML = "";
  state.log.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    logElement.appendChild(li);
  });
};

const renderCropButtons = () => {
  cropButtonsContainer.innerHTML = "";
  crops.forEach((crop) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `crop-button${
      crop.id === state.selectedCropId ? " crop-button--selected" : ""
    }`;
    button.innerHTML = `
      <span class="crop-button__title">${crop.emoji} ${crop.name}</span>
      <span class="crop-button__details">
        <span>Cost: ${crop.cost}</span>
        <span>Reward: ${crop.reward}</span>
        <span>Time: ${formatTime(crop.growthSeconds)}</span>
      </span>
      <span class="crop-button__description">${crop.description}</span>
    `;
    button.addEventListener("click", () => selectCrop(crop.id));
    cropButtonsContainer.appendChild(button);
  });
};

const renderPlots = () => {
  fieldElement.innerHTML = "";
  state.plots.forEach((plot, index) => {
    const plotNode = plotTemplate.content.firstElementChild.cloneNode(true);
    const statusElement = plotNode.querySelector(".plot__status");
    const progressElement = plotNode.querySelector(".plot__progress");
    const emojiElement = plotNode.querySelector(".plot__emoji");

    if (plot.state === "empty") {
      plotNode.classList.remove("plot--growing", "plot--ready");
      emojiElement.textContent = "🌱";
      statusElement.textContent = "Empty plot";
      progressElement.textContent = "";
      plotNode.addEventListener("click", () => plantCrop(index));
    } else if (plot.state === "growing") {
      plotNode.classList.add("plot--growing");
      const crop = getCropById(plot.cropId);
      const now = Date.now();
      const remainingMs = Math.max(plot.readyAt - now, 0);
      const remainingSeconds = remainingMs / 1000;
      const progress = Math.min(
        ((crop.growthSeconds - remainingSeconds) / crop.growthSeconds) * 100,
        100
      );
      emojiElement.textContent = crop.emoji;
      statusElement.textContent = `${crop.name} is growing`;
      progressElement.textContent = `${progress.toFixed(0)}% grown (${formatTime(
        remainingSeconds
      )})`;
      plotNode.addEventListener("click", () => addLogEntry("Be patient, it's still growing."));
    } else if (plot.state === "ready") {
      plotNode.classList.add("plot--ready");
      const crop = getCropById(plot.cropId);
      emojiElement.textContent = crop.emoji;
      statusElement.textContent = `${crop.name} is ready!`;
      progressElement.textContent = "Harvest now";
      plotNode.addEventListener("click", () => harvestCrop(index));
    }

    plotNode.setAttribute("aria-label", `${statusElement.textContent} (plot ${
      index + 1
    })`);
    plotNode.dataset.index = index;
    fieldElement.appendChild(plotNode);
  });
};

const toggleHelpModal = () => {
  const isHidden = helpModal.hasAttribute("hidden");
  if (isHidden) {
    helpModal.removeAttribute("hidden");
  } else {
    helpModal.setAttribute("hidden", "");
  }
};

helpButton.addEventListener("click", () => toggleHelpModal());
closeHelpButton.addEventListener("click", () => toggleHelpModal());
helpModal.addEventListener("click", (event) => {
  if (event.target === helpModal) {
    toggleHelpModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !helpModal.hasAttribute("hidden")) {
    toggleHelpModal();
  }
});

setInterval(updateGrowth, 1000);
setInterval(advanceDay, 60 * 1000);

renderStats();
renderLog();
renderCropButtons();
renderPlots();
