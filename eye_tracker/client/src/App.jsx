
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import GazeHeatmap from "./components/GazeHeatmap";

const API = "http://127.0.0.1:8000";

const PASSAGE =
  "Last Sunday, Nimal visited his grandmother's house in the village. " +
  "He saw green paddy fields, tall coconut trees, and colourful flowers. " +
  "In the morning, he helped his grandmother feed the chickens. " +
  "Later, he played with his cousins near the garden. " +
  "Before going home, Nimal thanked his grandmother for a wonderful day.";

const TARGETS = [
  { x: 0.08, y: 0.08 },
  { x: 0.5, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.08, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.92, y: 0.5 },
  { x: 0.08, y: 0.92 },
  { x: 0.5, y: 0.92 },
  { x: 0.92, y: 0.92 },
];

const VALIDATION_TARGETS = [
  { x: 0.2, y: 0.2 },
  { x: 0.5, y: 0.2 },
  { x: 0.8, y: 0.2 },
  { x: 0.2, y: 0.5 },
  { x: 0.8, y: 0.5 },
  { x: 0.2, y: 0.8 },
  { x: 0.5, y: 0.8 },
  { x: 0.8, y: 0.8 },
];

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

function getCoordinate(sample, axis) {
  const keys =
    axis === "x"
      ? ["gaze_x", "predicted_x", "screen_x"]
      : ["gaze_y", "predicted_y", "screen_y"];

  for (const key of keys) {
    const value = sample[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      const number = Number(value);

      if (number >= 0 && number <= 1) {
        return number;
      }
    }
  }

  return null;
}

function getTimestamp(sample) {
  const value =
    sample.timestamp_seconds ??
    sample.timestamp ??
    sample.time_seconds ??
    sample.time ??
    sample.frame_time;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (Number.isFinite(number)) {
    return number > 1e12 ? number / 1000 : number;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed / 1000 : null;
}

function getWordBoxes(elements) {
  return elements
    .map((element, index) => {
      if (!element) return null;

      const rect = element.getBoundingClientRect();

      return {
        index,
        word: element.dataset.word || "",
        left: rect.left / window.innerWidth,
        right: rect.right / window.innerWidth,
        top: rect.top / window.innerHeight,
        bottom: rect.bottom / window.innerHeight,
      };
    })
    .filter(Boolean);
}

/*
 * Convert normalized screen coordinates into coordinates relative
 * to the reading passage. The heatmap uses these saved relative
 * coordinates so it can be displayed later on the results page.
 *
 * This assumes the backend gaze coordinates are calibrated screen
 * coordinates, not raw iris-relative coordinates.
 */
function mapSamplesToPassage(samples, bounds) {
  if (!bounds || !bounds.width || !bounds.height) {
    return samples.map((sample) => ({
      ...sample,
      heatmap_x: null,
      heatmap_y: null,
    }));
  }

  return samples.map((sample) => {
    const x = getCoordinate(sample, "x");
    const y = getCoordinate(sample, "y");

    if (x === null || y === null) {
      return {
        ...sample,
        heatmap_x: null,
        heatmap_y: null,
      };
    }

    const screenX = x * window.innerWidth;
    const screenY = y * window.innerHeight;

    const localX = (screenX - bounds.left) / bounds.width;
    const localY = (screenY - bounds.top) / bounds.height;

    if (
      localX < 0 ||
      localX > 1 ||
      localY < 0 ||
      localY > 1
    ) {
      return {
        ...sample,
        heatmap_x: null,
        heatmap_y: null,
      };
    }

    return {
      ...sample,
      heatmap_x: localX,
      heatmap_y: localY,
    };
  });
}

function median(values) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function summarizeValidation(samples) {
  const validSamples = samples.filter((sample) => {
    if (
      sample.gaze_x === null ||
      sample.gaze_x === undefined ||
      sample.gaze_x === "" ||
      sample.gaze_y === null ||
      sample.gaze_y === undefined ||
      sample.gaze_y === ""
    ) {
      return false;
    }

    const x = Number(sample.gaze_x);
    const y = Number(sample.gaze_y);

    return (
      sample.face_detected === true &&
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= 0 &&
      x <= 1 &&
      y >= 0 &&
      y <= 1
    );
  });

  const targetErrors = VALIDATION_TARGETS.flatMap((target, index) => {
    const targetSamples = samples.filter(
      (sample) => Number(sample.target_index) === index
    );
    const inScreen = targetSamples.filter((sample) => {
      if (
        sample.gaze_x === null ||
        sample.gaze_x === undefined ||
        sample.gaze_x === "" ||
        sample.gaze_y === null ||
        sample.gaze_y === undefined ||
        sample.gaze_y === ""
      ) {
        return false;
      }

      const x = Number(sample.gaze_x);
      const y = Number(sample.gaze_y);
      return (
        sample.face_detected === true &&
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        x >= 0 &&
        x <= 1 &&
        y >= 0 &&
        y <= 1
      );
    });
    const x = median(inScreen.map((sample) => Number(sample.gaze_x)));
    const y = median(inScreen.map((sample) => Number(sample.gaze_y)));

    if (x === null || y === null) return [];

    return [{
      xErrorPx: (x - target.x) * window.innerWidth,
      yErrorPx: (y - target.y) * window.innerHeight,
    }];
  });

  const errorsSquared = targetErrors.map(
    (error) => error.xErrorPx ** 2 + error.yErrorPx ** 2
  );
  const meanErrorPx = errorsSquared.length > 0
    ? errorsSquared.reduce((sum, error) => sum + Math.sqrt(error), 0) /
      errorsSquared.length
    : null;
  const rmsePx = errorsSquared.length > 0
    ? Math.sqrt(
        errorsSquared.reduce((sum, error) => sum + error, 0) /
          errorsSquared.length
      )
    : null;
  const viewportDiagonal = Math.hypot(
    window.innerWidth,
    window.innerHeight
  );

  return {
    targetCount: VALIDATION_TARGETS.length,
    validatedTargets: targetErrors.length,
    totalSamples: samples.length,
    inScreenSamples: validSamples.length,
    meanErrorPx,
    rmsePx,
    meanErrorPercentDiagonal:
      meanErrorPx === null || viewportDiagonal === 0
        ? null
        : (meanErrorPx / viewportDiagonal) * 100,
    inScreenPercent:
      samples.length === 0
        ? null
        : (validSamples.length / samples.length) * 100,
  };
}

function analyseReading(samples, wordBoxes) {
  const words = wordBoxes.map((box) => ({
    ...box,
    visits: 0,
    samples: 0,
    fixationMs: 0,
  }));

  const orderedSamples = samples
    .map((sample) => ({
      timestamp: getTimestamp(sample),
      x: getCoordinate(sample, "x"),
      y: getCoordinate(sample, "y"),
    }))
    .sort((a, b) => {
      if (a.timestamp === null && b.timestamp === null) {
        return 0;
      }

      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;

      return a.timestamp - b.timestamp;
    });

  let regressions = 0;
  let fixationTotal = 0;
  let previousWord = -1;
  let previousTimestamp = null;

  for (const sample of orderedSamples) {
    const { x, y, timestamp } = sample;

    const wordIndex =
      x === null || y === null
        ? -1
        : words.findIndex(
            (word) =>
              x >= word.left &&
              x <= word.right &&
              y >= word.top &&
              y <= word.bottom
          );

    if (wordIndex < 0) {
      previousWord = -1;
      previousTimestamp = null;
      continue;
    }

    const word = words[wordIndex];
    word.samples += 1;

    if (wordIndex !== previousWord) {
      word.visits += 1;

      if (
        previousWord >= 0 &&
        wordIndex < previousWord
      ) {
        regressions += 1;
      }
    }

    if (
      wordIndex === previousWord &&
      timestamp !== null &&
      previousTimestamp !== null
    ) {
      const delta = (timestamp - previousTimestamp) * 1000;

      if (delta >= 0 && delta <= 250) {
        word.fixationMs += delta;
        fixationTotal += delta;
      }
    }

    previousWord = wordIndex;
    previousTimestamp = timestamp;
  }

  return {
    words,
    regressions,
    fixationTotal,
  };
}

export default function App() {
  const [step, setStep] = useState("setup");
  const [participantCode, setParticipantCode] = useState("");
  const [serviceReady, setServiceReady] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  const [calibrationMode, setCalibrationMode] = useState("eye");
  const [currentTarget, setCurrentTarget] = useState(null);
  const [calibrationRunning, setCalibrationRunning] = useState(false);
  const [eyeDone, setEyeDone] = useState(false);
  const [combinedDone, setCombinedDone] = useState(false);

  const [samples, setSamples] = useState([]);
  const [wordAnalytics, setWordAnalytics] = useState([]);
  const [regressionCount, setRegressionCount] = useState(0);
  const [totalFixationMs, setTotalFixationMs] = useState(0);
  const [readingSeconds, setReadingSeconds] = useState(0);

  const [message, setMessage] = useState(
    "Connecting to the research service..."
  );
  const [busy, setBusy] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState("");

  const participantRef = useRef("");
  const wordRefs = useRef([]);
  const wordBoxesRef = useRef([]);
  const passageRef = useRef(null);
  const passageBoundsRef = useRef(null);
  const readingStartedAtRef = useRef(null);

  useEffect(() => {
    participantRef.current = participantCode.trim();
  }, [participantCode]);

  const checkService = useCallback(async () => {
    try {
      await api("/api/health");
      setServiceReady(true);
      setMessage("Research service is ready.");
      return true;
    } catch {
      setServiceReady(false);
      setMessage("Start the Python service and try again.");
      return false;
    }
  }, []);

  useEffect(() => {
    checkService();
  }, [checkService]);

  const sendTarget = useCallback(async (payload) => {
    return api("/api/calibration/target", {
      method: "POST",
      body: JSON.stringify({
        participant_code: participantRef.current,
        ...payload,
      }),
    });
  }, []);

  const startCamera = useCallback(async () => {
    if (!participantRef.current) {
      throw new Error(
        "Enter an anonymous participant code first."
      );
    }

    const result = await api("/api/tracker/start", {
      method: "POST",
      body: JSON.stringify({
        participant_code: participantRef.current,
      }),
    });

    if (result.status === "error") {
      throw new Error(
        result.message || "Could not start the tracker."
      );
    }

    setCameraStarted(true);
    await wait(700);
  }, []);

  const beginCalibration = async (mode) => {
    setBusy(true);
    setError("");
    setCalibrationMode(mode);
    let activeStage = mode;

    if (mode === "eye") setEyeDone(false);
    if (mode === "eye_head") {
      setCombinedDone(false);
      setModelInfo(null);
    }

    try {
      const health = await api("/api/health");

      if (health.status && health.status !== "ok") {
        throw new Error("The research service is not ready.");
      }

      setServiceReady(true);

      if (!cameraStarted) {
        await startCamera();
      }

      setStep("calibration");
      setCalibrationRunning(true);
      setMessage(
        mode === "eye"
          ? "Eye calibration is in progress."
          : "Eye and head calibration is in progress."
      );

      await wait(400);

      for (let i = 0; i < TARGETS.length; i++) {
        const target = TARGETS[i];

        setCurrentTarget(target);

        await sendTarget({
          active: false,
          stage: mode,
          target_index: i,
          x: target.x,
          y: target.y,
        });

        await wait(300);

        await sendTarget({
          active: true,
          stage: mode,
          target_index: i,
          x: target.x,
          y: target.y,
        });

        await wait(1800);
      }

      await sendTarget({
        active: false,
        stage: mode,
        target_index: -1,
        x: null,
        y: null,
      });

      if (mode === "eye") {
        setCurrentTarget(null);
        setCalibrationRunning(false);
        setEyeDone(true);
        setMessage("Eye calibration completed successfully.");
      } else {
        const fit = await api("/api/calibration/fit", {
          method: "POST",
          body: JSON.stringify({}),
        });

        activeStage = "validation";
        setCalibrationMode("validation");
        setMessage(
          "Model fitted. Collecting held-out target-check samples."
        );

        for (let i = 0; i < VALIDATION_TARGETS.length; i += 1) {
          const target = VALIDATION_TARGETS[i];
          setCurrentTarget(target);

          await sendTarget({
            active: false,
            stage: activeStage,
            target_index: i,
            x: target.x,
            y: target.y,
          });

          await wait(300);

          await sendTarget({
            active: true,
            stage: activeStage,
            target_index: i,
            x: target.x,
            y: target.y,
          });

          await wait(1800);
        }

        await sendTarget({
          active: false,
          stage: activeStage,
          target_index: -1,
          x: null,
          y: null,
        });
        await wait(250);

        const validationData = await api(
          "/api/tracker/samples?stage=validation"
        );
        const validation = summarizeValidation(
          validationData.samples || []
        );

        setCombinedDone(true);
        setModelInfo({ ...fit, validation });
        setMessage(
          "Held-out target check completed. Review its error and coverage."
        );
        setCurrentTarget(null);
        setCalibrationRunning(false);
      }

      setStep("ready");
    } catch (err) {
      setCalibrationRunning(false);
      setCurrentTarget(null);
      setStep("ready");
      const calibrationError =
        activeStage === "validation" &&
        err.message === "Invalid stage"
          ? "The Python API is still running an older version. Stop and restart the Python service, then repeat eye and head calibration."
          : err.message || "Calibration failed.";
      setError(calibrationError);
      setMessage("Calibration could not be completed.");

      try {
        await sendTarget({
          active: false,
          stage: activeStage,
          target_index: -1,
          x: null,
          y: null,
        });
      } catch {
        // Preserve the original error.
      }
    } finally {
      setBusy(false);
    }
  };

  const startReading = async () => {
    setBusy(true);
    setError("");

    try {
      if (!combinedDone) {
        throw new Error(
          "Complete eye and head calibration first."
        );
      }

      await sendTarget({
        active: true,
        stage: "reading",
        target_index: -1,
        x: null,
        y: null,
      });

      setSamples([]);
      setWordAnalytics([]);
      setRegressionCount(0);
      setTotalFixationMs(0);
      setReadingSeconds(0);

      wordRefs.current = [];
      wordBoxesRef.current = [];
      passageBoundsRef.current = null;
      readingStartedAtRef.current = Date.now();

      setStep("reading");
      setMessage("Reading data collection is in progress.");
    } catch (err) {
      setError(err.message || "Could not start reading.");
    } finally {
      setBusy(false);
    }
  };

  const capturePassageBounds = useCallback(() => {
    const passage = passageRef.current;

    if (!passage) return null;

    const text = passage.querySelector("p");
    if (!text) return null;

    const rect = text.getBoundingClientRect();

    const bounds = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    passageBoundsRef.current = bounds;
    return bounds;
  }, []);

  useEffect(() => {
    if (step !== "reading") return undefined;

    const updateLayout = () => {
      capturePassageBounds();
      wordBoxesRef.current = getWordBoxes(wordRefs.current);
    };

    updateLayout();

    window.addEventListener("resize", updateLayout);

    return () => {
      window.removeEventListener("resize", updateLayout);
    };
  }, [step, capturePassageBounds]);

  useEffect(() => {
    if (step !== "reading") return undefined;

    let cancelled = false;
    let timer;

    const poll = async () => {
      try {
        const data = await api(
          "/api/tracker/samples?stage=reading"
        );

        if (!cancelled) {
          const rawSamples = data.samples || [];
          const bounds = capturePassageBounds();

          const mappedSamples = mapSamplesToPassage(
            rawSamples,
            bounds
          );

          setSamples(mappedSamples);
          wordBoxesRef.current = getWordBoxes(wordRefs.current);
        }
      } catch {
        // Retry on the next polling cycle.
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, 1000);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, capturePassageBounds]);

  const finishReading = async () => {
    setBusy(true);
    setError("");

    try {
      const bounds =
        capturePassageBounds() || passageBoundsRef.current;

      wordBoxesRef.current = getWordBoxes(wordRefs.current);

      await sendTarget({
        active: false,
        stage: "reading",
        target_index: -1,
        x: null,
        y: null,
      });

      await wait(250);

      try {
        await api("/api/tracker/stop", {
          method: "POST",
          body: JSON.stringify({}),
        });
      } finally {
        setCameraStarted(false);
      }

      const data = await api(
        "/api/tracker/samples?stage=reading"
      );

      const rawSamples = data.samples || [];
      const finalSamples = mapSamplesToPassage(
        rawSamples,
        bounds
      );

      const duration = readingStartedAtRef.current
        ? Math.max(
            0,
            Date.now() - readingStartedAtRef.current
          )
        : 0;

      const analytics = analyseReading(
        finalSamples,
        wordBoxesRef.current
      );

      setSamples(finalSamples);
      setReadingSeconds(duration / 1000);
      setWordAnalytics(analytics.words);
      setRegressionCount(analytics.regressions);
      setTotalFixationMs(analytics.fixationTotal);

      setStep("completed");
      setMessage("Reading session completed.");
    } catch (err) {
      setError(
        err.message || "Could not finish the reading session."
      );
    } finally {
      setBusy(false);
    }
  };

  const resetSession = async () => {
    setBusy(true);
    setError("");

    try {
      if (cameraStarted) {
        await api("/api/tracker/stop", {
          method: "POST",
          body: JSON.stringify({}),
        });
      }
    } catch {
      // Continue resetting the interface.
    }

    setCameraStarted(false);
    setEyeDone(false);
    setCombinedDone(false);
    setCalibrationRunning(false);
    setCurrentTarget(null);
    setSamples([]);
    setModelInfo(null);
    setWordAnalytics([]);
    setRegressionCount(0);
    setTotalFixationMs(0);
    setReadingSeconds(0);

    wordRefs.current = [];
    wordBoxesRef.current = [];
    passageBoundsRef.current = null;
    readingStartedAtRef.current = null;

    setStep("setup");
    setMessage("Ready for a new session.");
    setParticipantCode("");
    setBusy(false);
  };

  const renderPassageWords = (interactive = false) => (
    <p>
      {PASSAGE.split(/\s+/).map((word, index) => (
        <span
          key={index}
          ref={
            interactive
              ? (element) => {
                  wordRefs.current[index] = element;
                }
              : undefined
          }
          data-word={word}
          className={interactive ? "passage-word" : undefined}
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );

  const mappedWords = wordAnalytics.filter(
    (word) => word.samples > 0
  ).length;

  if (step === "calibration" && calibrationRunning) {
    return (
      <main className="calibration-screen">
        <div className="calibration-instructions">
          Follow the blue dot with your eyes. Sit comfortably.
        </div>

        {currentTarget && (
          <div
            className="calibration-dot"
            style={{
              left: `${currentTarget.x * 100}%`,
              top: `${currentTarget.y * 100}%`,
            }}
          />
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="brand-icon" aria-hidden="true">
              ET
            </div>

            <div>
              <p className="eyebrow">READING RESEARCH</p>
              <h1>PogoLearn</h1>
              <p className="subtitle">
                Playful · Active · Positive
              </p>
            </div>
          </div>

          <span
            className={`service-badge ${
              serviceReady ? "online" : ""
            }`}
          >
            {serviceReady
              ? "Ready for your session"
              : "Service disconnected"}
          </span>
        </header>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {step === "setup" && (
          <section className="panel">
            <p className="eyebrow">SESSION SETUP</p>
            <h2>Ready to get started?</h2>
            <p>
              You will read a short story while the research
              system records estimated eye movements.
            </p>

            <label htmlFor="participantCode">
              Anonymous participant code
            </label>

            <input
              id="participantCode"
              value={participantCode}
              onChange={(event) =>
                setParticipantCode(event.target.value)
              }
              placeholder="For example, P001"
              maxLength={32}
              autoComplete="off"
            />

            <p className="status-text">
              Do not enter your name or other identifying information.
            </p>

            <button
              onClick={async () => {
                setBusy(true);
                setError("");

                try {
                  if (!participantCode.trim()) {
                    throw new Error(
                      "Enter a participant code first."
                    );
                  }

                  const health = await api("/api/health");

                  if (
                    health.status &&
                    health.status !== "ok"
                  ) {
                    throw new Error(
                      "The research service is not ready."
                    );
                  }

                  setServiceReady(true);
                  setStep("ready");
                  setMessage("Your session is ready.");
                } catch (err) {
                  setError(err.message);
                  setServiceReady(false);
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy || !participantCode.trim()}
            >
              {busy ? "Connecting..." : "Continue"}
            </button>
          </section>
        )}

        {step === "ready" && (
          <section className="panel">
            <p className="eyebrow">
              CALIBRATION AND READING
            </p>
            <h2>Let's prepare for reading</h2>
            <p>
              Ask the student to sit comfortably, face the webcam,
              and follow each blue dot when it appears.
            </p>

            <div className="checklist">
              <div className={eyeDone ? "completed-step" : ""}>
                <span>{eyeDone ? "✓" : "1"}</span>
                <div>
                  <strong>Look at the dots</strong>
                  <p>
                    Nine targets help record eye-related features.
                  </p>
                  {eyeDone && (
                    <small className="success-label">
                      Completed
                    </small>
                  )}
                </div>
              </div>

              <div
                className={combinedDone ? "completed-step" : ""}
              >
                <span>{combinedDone ? "✓" : "2"}</span>
                <div>
                  <strong>Look and sit naturally</strong>
                  <p>
                    A second calibration combines eye and head features.
                  </p>
                  {combinedDone && (
                    <small className="success-label">
                      Completed
                    </small>
                  )}
                </div>
              </div>

              <div
                className={combinedDone ? "completed-step" : ""}
              >
                <span>{combinedDone ? "✓" : "3"}</span>
                <div>
                  <strong>Read the passage</strong>
                  <p>
                    Read at a comfortable pace while gaze data is collected.
                  </p>
                  {combinedDone && (
                    <small className="success-label">
                      Ready to start
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div className="button-stack">
              <button
                className={
                  eyeDone
                    ? "calibration-button calibration-complete"
                    : "calibration-button"
                }
                onClick={() => beginCalibration("eye")}
                disabled={busy}
              >
                {busy && calibrationMode === "eye"
                  ? "Calibrating..."
                  : eyeDone
                    ? "Eye calibration completed"
                    : "1. Start eye calibration"}
              </button>

              <button
                className={
                  combinedDone
                    ? "calibration-button calibration-complete"
                    : "calibration-button"
                }
                onClick={() => beginCalibration("eye_head")}
                disabled={busy}
              >
                {busy && calibrationMode === "validation"
                  ? "Validating..."
                  : busy && calibrationMode === "eye_head"
                    ? "Calibrating..."
                    : combinedDone
                      ? "Eye and head calibration completed"
                      : "2. Start eye and head calibration"}
              </button>

              <button
                className={combinedDone ? "success-button" : ""}
                onClick={startReading}
                disabled={busy || !combinedDone}
              >
                3. Start reading task
              </button>
            </div>

            {modelInfo && (
              <div className="model-info">
                <strong>Calibration model created</strong>
                <p>
                  Training samples: {modelInfo.sample_count}
                </p>
                <p>
                  Training RMSE — x:{" "}
                  {(modelInfo.calibration_rmse_x * 100).toFixed(1)}% of
                  screen width, y:{" "}
                  {(modelInfo.calibration_rmse_y * 100).toFixed(1)}% of
                  screen height
                </p>
                <small>
                  Training error is not the same as independent gaze accuracy.
                </small>
                {modelInfo.validation && (
                  <>
                    <p>
                      Held-out targets with usable estimates:{" "}
                      {modelInfo.validation.validatedTargets} /{" "}
                      {modelInfo.validation.targetCount}
                    </p>
                    <p>
                      Mean error:{" "}
                      {modelInfo.validation.meanErrorPx === null
                        ? "not available"
                        : `${modelInfo.validation.meanErrorPx.toFixed(0)} px`}
                      {modelInfo.validation.meanErrorPercentDiagonal === null
                        ? ""
                        : ` (${modelInfo.validation.meanErrorPercentDiagonal.toFixed(1)}% of screen diagonal)`}
                    </p>
                    <p>
                      Target RMSE:{" "}
                      {modelInfo.validation.rmsePx === null
                        ? "not available"
                        : `${modelInfo.validation.rmsePx.toFixed(0)} px`}
                    </p>
                    <p>
                      In-screen samples:{" "}
                      {modelInfo.validation.inScreenSamples} /{" "}
                      {modelInfo.validation.totalSamples}
                      {modelInfo.validation.inScreenPercent === null
                        ? ""
                        : ` (${modelInfo.validation.inScreenPercent.toFixed(1)}%)`}
                    </p>
                    <small>
                      Error uses the median estimate at each held-out target.
                      This is a separate pass in this session, not
                      cross-participant validation.
                    </small>
                  </>
                )}
              </div>
            )}

            <p className="status-text">{message}</p>
          </section>
        )}

        {step === "reading" && (
          <section className="reading-layout">
            <div className="reading-top">
              <div>
                <p className="eyebrow">READING TASK</p>
                <h2>Read the story</h2>
              </div>

              <span className="sample-count">
                Samples collected: {samples.length}
              </span>
            </div>

            <article className="passage-card" ref={passageRef}>
              {renderPassageWords(true)}
            </article>

            <p className="reading-hint">
              Take your time. Read in your usual way and keep your face
              visible to the webcam.
            </p>

            <button onClick={finishReading} disabled={busy}>
              {busy ? "Finishing session..." : "Finish reading"}
            </button>
          </section>
        )}

        {step === "completed" && (
          <section className="panel completion-panel">
            <div className="completion-icon" aria-hidden="true">
              ✓
            </div>

            <p className="eyebrow">SESSION COMPLETED</p>
            <h2>Reading session completed</h2>
            <p>
              The reading task has ended. You can now view the
              estimated gaze results on the analytics dashboard.
            </p>

            <div className="completion-summary">
              <div>
                <strong>{samples.length}</strong>
                <span>Gaze samples</span>
              </div>

              <div>
                <strong>{readingSeconds.toFixed(1)} s</strong>
                <span>Reading duration</span>
              </div>
            </div>

            <button onClick={() => setStep("results")}>
              View analytics
            </button>
          </section>
        )}

        {step === "results" && (
          <section className="reading-layout results-layout">
            <div className="reading-top">
              <div>
                <p className="eyebrow">SESSION ANALYTICS</p>
                <h2>Reading behaviour</h2>
              </div>

              <span className="sample-count">
                {samples.length} gaze samples
              </span>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <span>Estimated regressions</span>
                <strong>{regressionCount}</strong>
                <small>
                  Backward transitions between mapped words
                </small>
              </div>

              <div className="analytics-card">
                <span>Estimated dwell time</span>
                <strong>
                  {(totalFixationMs / 1000).toFixed(2)} s
                </strong>
                <small>
                  Accumulated time across consecutive samples
                </small>
              </div>

              <div className="analytics-card">
                <span>Words with mapped gaze</span>
                <strong>
                  {mappedWords} / {wordAnalytics.length}
                </strong>
                <small>
                  Words assigned at least one valid gaze sample
                </small>
              </div>

              <div className="analytics-card">
                <span>Reading duration</span>
                <strong>{readingSeconds.toFixed(1)} s</strong>
                <small>Total reading session time</small>
              </div>
            </div>

            <div className="analytics-section">
              <div>
                <p className="eyebrow">GAZE DISTRIBUTION</p>
                <h3>Reading passage heatmap</h3>
                <p className="disclaimer">
                  Red and yellow indicate higher estimated gaze
                  concentration; blue and purple indicate lower
                  concentration.
                </p>
              </div>

              <div className="gaze-heatmap-wrapper">
                {renderPassageWords(false)}

                <GazeHeatmap
                  samples={samples}
                  opacity={0.7}
                  radius={24}
                />
              </div>

              <div className="legend">
                <span className="legend-dot red" />
                Higher concentration
                <span className="legend-dot yellow" />
                Moderate concentration
                <span className="legend-dot blue" />
                Lower concentration
              </div>

              {samples.length === 0 && (
                <p className="disclaimer">
                  No gaze samples were returned for this session.
                </p>
              )}

              <p className="disclaimer">
                This is an experimental webcam-based gaze estimate.
                It does not directly measure comprehension or validated
                eye fixations. The heatmap only includes samples with
                usable calibrated gaze coordinates inside the passage.
              </p>
            </div>

            <p className="disclaimer">
              Dwell time and regressions are experimental estimates.
              They should not be treated as validated measurements
              of reading ability or comprehension.
            </p>

            <div className="results-actions">
              <button
                className="secondary-button"
                onClick={() => setStep("completed")}
              >
                Back to completion
              </button>

              <button onClick={resetSession} disabled={busy}>
                Start a new session
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
