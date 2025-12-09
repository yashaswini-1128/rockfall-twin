def score(u,v,p,rain):
    # Simple heuristic scoring
    prob = min(1.0, 0.15 + 0.12*abs(v) + 0.006*p + 0.01*rain)
    label = "High" if prob>=0.7 else "Medium" if prob>=0.4 else "Low"
    return prob, label
