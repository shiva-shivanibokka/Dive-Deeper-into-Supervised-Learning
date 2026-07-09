"use client";

export default function AboutTab() {
  return (
    <div className="about">
      <p className="note" style={{ fontSize: "1rem" }}>
        This playground accompanies a series of notebooks on <strong>supervised learning</strong> — teaching a
        computer to predict an answer from labeled examples. Every demo here is trained on the{" "}
        <a href="https://www.openml.org/d/1590" target="_blank" rel="noreferrer">Adult Census Income</a> dataset
        (predict whether a person earns more than $50K/year) except the k-NN &amp; SVM demo, which uses a 2D toy
        dataset so its decision boundary can actually be drawn. Nothing runs on a server — each model is
        precomputed and evaluated right in your browser.
      </p>

      <h3><span className="num">01</span> Decision Tree</h3>
      <p>
        The simplest model here: a flowchart of <span className="k">yes/no questions</span>. To make a
        prediction it walks from the top, answering one question per step, until it reaches a leaf. Because it
        follows a single path, it only ever looks at the handful of features on that path — which is why, in the
        demo, changing a control the tree doesn't ask about won't move the prediction. Deeper trees ask more
        questions but risk memorizing noise.
      </p>

      <h3><span className="num">02</span> Boosting (LightGBM)</h3>
      <p>
        Instead of one tree, boosting builds <span className="k">hundreds of small trees in sequence</span>, each
        one correcting the mistakes of the ones before it. The result is one of the strongest models for tabular
        data. The demo runs a genuine 80-tree LightGBM live — and because it blends all those trees, every
        feature you change nudges the prediction. Watching that nudge is a live “what-if” explanation.
      </p>

      <h3><span className="num">03</span> Ensembles</h3>
      <p>
        A different way to combine models: train several <span className="k">different</span> algorithms and let
        them vote. The catch — averaging only helps when the models <em>disagree</em>. Combine near-identical
        models and you gain nothing; combine diverse ones (a linear model, a forest, an SVM, a k-NN) and the
        group beats any single member. The demo lets you toggle members and watch accuracy and “agreement”
        respond.
      </p>

      <h3><span className="num">05</span> k-NN &amp; SVM</h3>
      <p>
        The two classic <span className="k">non-tree</span> models, both based on geometry. <strong>k-NN</strong>{" "}
        predicts by looking at the k nearest examples and taking a vote. <strong>SVM</strong> finds the widest
        “street” separating the classes, and a <em>kernel</em> lets it curve that street around non-linear data.
        The demo draws their decision boundaries on two interleaving half-moons so you can see how k, the kernel,
        and the C and gamma knobs reshape them.
      </p>

      <h3><span className="num">06</span> Interpretability</h3>
      <p>
        Powerful models are often black boxes, so we open them up. <span className="k">Partial dependence</span>{" "}
        shows a feature's average effect across everyone; <span className="k">SHAP</span> breaks a single
        person's prediction into per-feature contributions that add up to their score. Together they answer both
        “what drives the model overall?” and “why did <em>this</em> person get flagged?”.
      </p>

      <h3><span className="num">07</span> Threshold Selection</h3>
      <p>
        A classifier really outputs a <span className="k">probability</span>, not a yes/no — something has to
        pick the cutoff. That cutoff is a business choice: a low threshold catches more high earners (higher
        recall) but raises false alarms (lower precision). The demo lets you drag the threshold and watch the
        confusion matrix and the ROC and precision-recall curves move in real time. The model never changes —
        only where you draw the line.
      </p>

      <h3><span className="num">04</span> Hyperparameter Optimization <span style={{ color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: ".85rem" }}>(notebook only)</span></h3>
      <p>
        One notebook covers <span className="k">tuning</span> — searching for a model's best settings with grid
        search, random search, and Bayesian optimization (Optuna). It's a search <em>process</em> rather than a
        single interactive prediction, so it lives in the notebook rather than as a widget here.
      </p>

      <div className="callout note" style={{ marginTop: "1.5rem" }}>
        <strong>The arc:</strong> build models (01–03), round out the algorithm zoo (05), tune them (04), explain
        them (06), and turn their probabilities into good decisions (07) — the full lifecycle of a
        supervised-learning model, on real data, with the code in the companion notebooks.
      </div>
    </div>
  );
}
