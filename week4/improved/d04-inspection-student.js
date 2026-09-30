/* 학생 확장: 지점 관찰과 O1/O2 직교 비교 */
(() => {
  "use strict";

  const viewer = window.InspectionViewer;
  if (!viewer) throw new Error("InspectionViewer가 먼저 준비되어야 합니다.");

  const host = document.querySelector("#student-ui");
  const canvas = viewer.canvas;
  const viewport = canvas.closest(".viewport");
  if (!host || !viewport)
    throw new Error("학생 UI 또는 뷰포트 영역을 찾을 수 없습니다.");

  const section = document.createElement("section");
  section.className = "student-poi";

  const heading = document.createElement("h2");
  heading.textContent = "관찰 지점";

  const current = document.createElement("p");
  current.setAttribute("aria-live", "polite");
  current.textContent = "현재 지점: 전체 보기 · 구역: 전체 시설";

  const poiList = document.createElement("div");
  poiList.className = "actions";

  const poiModeList = document.createElement("div");
  poiModeList.className = "actions";
  const contextButton = document.createElement("button");
  contextButton.className = "btn";
  contextButton.type = "button";
  contextButton.textContent = "장치와 주변 보기";
  const closeButton = document.createElement("button");
  closeButton.className = "btn";
  closeButton.type = "button";
  closeButton.textContent = "명판 확대";
  contextButton.disabled = true;
  closeButton.disabled = true;
  poiModeList.append(contextButton, closeButton);

  const comparisonHeading = document.createElement("h2");
  comparisonHeading.textContent = "직교 비교";

  const comparisonStatus = document.createElement("p");
  comparisonStatus.setAttribute("aria-live", "polite");
  comparisonStatus.textContent = "현재 비교: 없음 · 투영: 원근";

  const comparisonHint = document.createElement("p");
  comparisonHint.textContent =
    "직교 비교 중에는 드래그로 평행 이동하고 휠로 확대·축소합니다.";
  comparisonHint.hidden = true;

  const comparisonList = document.createElement("div");
  comparisonList.className = "actions";

  const areaNames = {
    entry: "입구",
    equipment: "설비 구역",
    roof: "옥상",
  };

  const poiButtons = new Map();
  const comparisonButtons = new Map();
  // 넓은 poi.group 대신 각 표지 주변에서 맥락을 주는 모델 상자만 선택합니다.
  const poiContextBoxIds = {
    P1: ["entry-post", "entry-backing", "rail-0--2", "rail-0--1", "rail-0-0"],
    P2: ["valve-body", "valve-pipe", "bench-0-3", "leg-0-3"],
    P3: ["cabinet", "partition-1", "bench-1-0", "leg-1-0"],
    P4: ["roof-service", "roof-walkway", "roof-right"],
    P5: ["rear-pipe", "back-1"],
    P6: ["annex-pump", "annex-roof", "annex-pillar-8.6-2.3"],
  };
  const modelBoxes = new Map(viewer.model.boxes.map((box) => [box.id, box]));
  let comparison = null;
  let selectedPoi = null;
  let poiMode = "context";
  let comparisonTarget = null;
  let comparisonHalfHeight = 8;
  let zoomFactor = 1;
  let drag = null;

  const guides = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  guides.setAttribute("viewBox", "0 0 100 100");
  guides.setAttribute("preserveAspectRatio", "none");
  guides.setAttribute("aria-hidden", "true");
  guides.classList.add("comparison-guides");
  guides.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:1";

  function drawGuide(kind) {
    guides.replaceChildren();
    const makeLine = (x1, y1, x2, y2) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", "rgba(255,255,255,0.38)");
      line.setAttribute("stroke-width", "0.18");
      guides.appendChild(line);
    };

    if (kind === "O1") {
      makeLine(8, 95, 92, 95);
      for (const x of [8, 29, 50, 71, 92]) makeLine(x, 94, x, 96);
    } else {
      makeLine(95, 8, 95, 92);
      for (const y of [8, 29, 50, 71, 92]) makeLine(94, y, 96, y);
    }
  }

  function showHome() {
    comparison = null;
    selectedPoi = null;
    poiMode = "context";
    comparisonTarget = null;
    drag = null;
    guides.style.display = "none";
    current.textContent = "현재 지점: 전체 보기 · 구역: 전체 시설";
    comparisonStatus.textContent = "현재 비교: 없음 · 투영: 원근";
    comparisonHint.hidden = true;
    contextButton.disabled = true;
    closeButton.disabled = true;
    for (const button of comparisonButtons.values()) {
      button.setAttribute("aria-pressed", "false");
    }
    for (const button of poiButtons.values()) {
      button.setAttribute("aria-pressed", "false");
    }
    contextButton.setAttribute("aria-pressed", "false");
    closeButton.setAttribute("aria-pressed", "false");
  }

  function leaveComparison() {
    comparison = null;
    comparisonTarget = null;
    drag = null;
    guides.style.display = "none";
    comparisonStatus.textContent = "현재 비교: 없음 · 투영: 원근";
    comparisonHint.hidden = true;
    for (const button of comparisonButtons.values()) {
      button.setAttribute("aria-pressed", "false");
    }
  }

  function setPoiMode(mode, countAction = true) {
    if (!selectedPoi) return;
    poiMode = mode;
    if (countAction) viewer.controls.state.actions++;
    applyPoiCamera(selectedPoi);
    updatePoiStatus();
  }

  function updatePoiStatus() {
    const modeLabel = poiMode === "close" ? "명판 확대" : "장치와 주변 보기";
    current.textContent = `현재 지점: ${selectedPoi.id} ${selectedPoi.name} · 구역: ${areaNames[selectedPoi.group] || selectedPoi.group} · 보기: ${modeLabel}`;
    contextButton.setAttribute("aria-pressed", String(poiMode === "context"));
    closeButton.setAttribute("aria-pressed", String(poiMode === "close"));
  }

  function visibleBounds(poi) {
    const ids = poiMode === "context" ? poiContextBoxIds[poi.id] : [];
    const boxes = (ids || []).map((id) => {
      const box = modelBoxes.get(id);
      if (!box)
        throw new Error(`${poi.id} 주변 상자 ${id}를 찾을 수 없습니다.`);
      return box;
    });
    const bounds = [];
    const contextRadius = 2.5;
    const localMin = poi.position.map((value) => value - contextRadius);
    const localMax = poi.position.map((value) => value + contextRadius);

    for (const box of boxes) {
      const [x, y, z] = box.position;
      const [sx, sy, sz] = box.size;
      const boxMin = [x - sx / 2, y - sy / 2, z - sz / 2];
      const boxMax = [x + sx / 2, y + sy / 2, z + sz / 2];
      const clippedMin = boxMin.map((value, axis) =>
        Math.max(value, localMin[axis]),
      );
      const clippedMax = boxMax.map((value, axis) =>
        Math.min(value, localMax[axis]),
      );
      if (clippedMin.some((value, axis) => value > clippedMax[axis])) continue;
      for (const dx of [clippedMin[0], clippedMax[0]]) {
        for (const dy of [clippedMin[1], clippedMax[1]]) {
          for (const dz of [clippedMin[2], clippedMax[2]]) {
            bounds.push([dx, dy, dz]);
          }
        }
      }
    }

    const right = [Math.cos(poi.yaw), 0, -Math.sin(poi.yaw)];
    const front = [Math.sin(poi.yaw), 0, Math.cos(poi.yaw)];
    const halfWidth = poi.size[0] / 2;
    const halfHeight = poi.size[1] / 2;
    for (const side of [-1, 1]) {
      for (const vertical of [-1, 1]) {
        bounds.push(
          poi.position.map(
            (value, axis) =>
              value +
              right[axis] * halfWidth * side +
              (axis === 1 ? halfHeight * vertical : 0),
          ),
        );
      }
    }
    return { bounds, right, front };
  }

  function applyPoiCamera(poi) {
    const controls = viewer.controls;
    const state = controls.state;
    const rect = canvas.getBoundingClientRect();
    const aspect =
      canvas.width && canvas.height
        ? canvas.width / canvas.height
        : rect.width / rect.height;
    const verticalFov = (state.fov * Math.PI) / 180;
    const tanHalfVertical = Math.tan(verticalFov / 2);
    const { bounds, right, front } = visibleBounds(poi);
    let distance = 0;
    for (const point of bounds) {
      const offset = point.map((value, axis) => value - poi.position[axis]);
      const horizontal = Math.abs(
        offset.reduce((sum, value, axis) => sum + value * right[axis], 0),
      );
      const vertical = Math.abs(offset[1]);
      const depthTowardCamera = offset.reduce(
        (sum, value, axis) => sum + value * front[axis],
        0,
      );
      distance = Math.max(
        distance,
        depthTowardCamera +
          Math.max(
            vertical / tanHalfVertical,
            horizontal / (tanHalfVertical * aspect),
          ),
      );
    }
    const closeViewDistance =
      Math.max(
        (poi.size[1] + 1.0) / (2 * tanHalfVertical),
        (poi.size[0] + 1.2) / (2 * tanHalfVertical * aspect),
      ) * 1.15;
    distance =
      poiMode === "context"
        ? Math.max(0.45, distance * 1.22)
        : Math.max(closeViewDistance, distance * 1.12);

    // 표지판 로컬 앞면은 +Z이며 yaw는 모델 생성 때 Y축 라디안 회전으로 적용됩니다.
    const halfYaw = poi.yaw / 2;
    state.target = [...poi.position];
    state.distance = Math.max(0.12, Math.min(100, distance));
    state.rotation = [0, Math.sin(halfYaw), 0, Math.cos(halfYaw)];
  }

  function selectPoi(poi) {
    leaveComparison();
    selectedPoi = poi;
    poiMode = "context";
    contextButton.disabled = false;
    closeButton.disabled = false;
    applyPoiCamera(poi);
    updatePoiStatus();

    viewer.controls.state.actions++;
    for (const [id, button] of poiButtons) {
      button.setAttribute("aria-pressed", String(id === poi.id));
    }
    for (const button of comparisonButtons.values()) {
      button.setAttribute("aria-pressed", "false");
    }
    canvas.focus();
  }

  function comparisonBounds(item) {
    const members = new Set(item.members);
    const boxes = viewer.model.boxes.filter((box) => members.has(box.id));
    if (boxes.length !== item.members.length) {
      throw new Error(`${item.id} 비교 대상 상자를 모두 찾을 수 없습니다.`);
    }

    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const box of boxes) {
      for (let axis = 0; axis < 3; axis++) {
        const halfSize = box.size[axis] / 2;
        min[axis] = Math.min(min[axis], box.position[axis] - halfSize);
        max[axis] = Math.max(max[axis], box.position[axis] + halfSize);
      }
    }
    return { min, max };
  }

  function selectComparison(item) {
    leavePoiSelection();
    selectedPoi = null;
    contextButton.disabled = true;
    closeButton.disabled = true;
    contextButton.setAttribute("aria-pressed", "false");
    closeButton.setAttribute("aria-pressed", "false");
    comparison = item;
    comparisonTarget = null;
    zoomFactor = 1;
    viewer.controls.state.actions++;
    current.textContent = "현재 지점: 비교 관찰";
    comparisonStatus.textContent = `현재 비교: ${item.id} ${item.name} · 투영: 직교 투영`;
    comparisonHint.hidden = false;

    for (const [id, button] of comparisonButtons) {
      button.setAttribute("aria-pressed", String(id === item.id));
    }
    drawGuide(item.id);
    guides.style.display = "block";
    canvas.focus();
  }

  function leavePoiSelection() {
    for (const button of poiButtons.values()) {
      button.setAttribute("aria-pressed", "false");
    }
  }

  for (const poi of viewer.model.poi) {
    const button = document.createElement("button");
    button.className = "btn";
    button.type = "button";
    button.textContent = `${poi.id} ${poi.name}`;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectPoi(poi));
    poiButtons.set(poi.id, button);
    poiList.appendChild(button);
  }

  contextButton.addEventListener("click", () => setPoiMode("context"));
  closeButton.addEventListener("click", () => setPoiMode("close"));

  const comparisonLabels = {
    O1: "O1 전면 비교",
    O2: "O2 오른쪽 측면 비교",
  };
  for (const item of viewer.model.comparisons) {
    const button = document.createElement("button");
    button.className = "btn";
    button.type = "button";
    button.textContent = comparisonLabels[item.id] || `${item.id} 비교`;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectComparison(item));
    comparisonButtons.set(item.id, button);
    comparisonList.appendChild(button);
  }

  section.append(
    heading,
    current,
    poiList,
    poiModeList,
    comparisonHeading,
    comparisonStatus,
    comparisonHint,
    comparisonList,
  );
  host.appendChild(section);
  viewport.appendChild(guides);

  // 기존 전체 보기 버튼은 렌더러에서 이미 카메라 복귀와 1회 집계를 처리합니다.
  document.querySelector("#home").addEventListener("click", showHome);

  // 비교 중에는 Home 키를 여기서 처리해 기본 컨트롤러와 중복 집계하지 않습니다.
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Home") return;
      const wasComparing = comparison !== null;
      showHome();
      if (event.target === canvas) {
        if (wasComparing) {
          event.preventDefault();
          event.stopImmediatePropagation();
          viewer.controls.home();
          viewer.controls.state.actions++;
        }
        return;
      }

      event.preventDefault();
      viewer.controls.home();
      viewer.controls.state.actions++;
    },
    true,
  );

  // 직교 비교에서는 회전을 막고 화면 평면 이동만 허용합니다.
  for (const type of [
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "lostpointercapture",
  ]) {
    canvas.addEventListener(
      type,
      (event) => {
        if (!comparison) return;
        event.preventDefault();
        event.stopImmediatePropagation();

        if (type === "pointerdown") {
          if (drag || ![0, 2].includes(event.button)) return;
          drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
          viewer.controls.state.actions++;
          canvas.setPointerCapture(event.pointerId);
          return;
        }

        if (!drag || drag.id !== event.pointerId) return;
        if (type === "pointermove") {
          const rect = canvas.getBoundingClientRect();
          const halfHeight = currentCameraHalfHeight();
          const unit = (2 * halfHeight) / rect.height;
          const right = comparison.id === "O1" ? [1, 0, 0] : [0, 0, -1];
          const up = [0, 1, 0];
          const dx = event.clientX - drag.x;
          const dy = event.clientY - drag.y;
          comparisonTarget = comparisonTarget.map(
            (value, axis) =>
              value - dx * unit * right[axis] + dy * unit * up[axis],
          );
          drag.x = event.clientX;
          drag.y = event.clientY;
        } else {
          drag = null;
        }
      },
      true,
    );
  }

  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!comparison) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      zoomFactor = Math.max(
        0.2,
        Math.min(5, zoomFactor * Math.exp(event.deltaY * 0.001)),
      );
      viewer.controls.state.actions++;
    },
    { capture: true, passive: false },
  );

  function currentCameraHalfHeight() {
    return comparisonHalfHeight;
  }

  function comparisonCamera(item) {
    const bounds = comparisonBounds(item);
    const target =
      comparisonTarget ||
      bounds.min.map((value, axis) => (value + bounds.max[axis]) / 2);
    comparisonTarget = [...target];

    const aspect = canvas.width / canvas.height;
    const horizontalAxis = item.id === "O1" ? 0 : 2;
    const depthAxis = item.id === "O1" ? 2 : 0;
    const horizontalSpan =
      bounds.max[horizontalAxis] - bounds.min[horizontalAxis];
    const verticalSpan = bounds.max[1] - bounds.min[1];
    const depthSpan = bounds.max[depthAxis] - bounds.min[depthAxis];
    const halfHeight =
      Math.max(verticalSpan / 2, horizontalSpan / (2 * aspect)) *
      1.2 *
      zoomFactor;
    comparisonHalfHeight = halfHeight;

    const direction = item.id === "O1" ? [0, 0, 1] : [1, 0, 0];
    const eyeDistance = depthSpan / 2 + 1;
    return {
      eye: target.map((value, axis) => value + direction[axis] * eyeDistance),
      target,
      up: [0, 1, 0],
      orthographic: true,
      halfHeight,
      near: 0.02,
      far: depthSpan + 2,
    };
  }

  viewer.render = (api) => {
    if (!comparison) {
      guides.style.display = "none";
      api.drawView(api.controls.camera());
      return;
    }
    api.drawView(comparisonCamera(comparison));
  };
})();
