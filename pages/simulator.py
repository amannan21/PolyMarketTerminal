import streamlit as st
import numpy as np

st.title("Markets")


positions = {
    # outcome : dict(shares, avg_price)
    "Zootopia 2": {"shares": 350, "avg_price": 0.38},
    "Minecraft":  {"shares": 500, "avg_price": 0.34},
    "Wicked":     {"shares":  90, "avg_price": 0.06},
    "Avatar 2":   {"shares":  80, "avg_price": 0.09},   # example old bet
}


scenarios = [
    {"name": "Zootopia wins", "Zootopia 2": 1, "Minecraft": 0, "Wicked": 0, "Avatar 2": 0},
    {"name": "Minecraft wins", "Zootopia 2": 0, "Minecraft": 1, "Wicked": 0, "Avatar 2": 0},
    {"name": "Wicked wins", "Zootopia 2": 0, "Minecraft": 0, "Wicked": 1, "Avatar 2": 0},
    {"name": "Avatar 2 wins", "Zootopia 2": 0, "Minecraft": 0, "Wicked": 0, "Avatar 2": 1},
    # edge case
    {"name": "No clear winner / all void", "Zootopia 2": 0, "Minecraft": 0, "Wicked": 0, "Avatar 2": 0},
]


# store the event in the session state after the user enters the URL
if "event" not in st.session_state:
    st.session_state.event = None

import pandas as pd

def simulate_portfolio(positions, scenarios, probs=None):
    rows = []
    total_cost = sum(v["shares"] * v["avg_price"] for v in positions.values())
    for sc in scenarios:
        name = sc["name"]
        payout = 0.0
        for outcome, spec in positions.items():
            shares = spec["shares"]
            avg_price = spec["avg_price"]
            payoff_per_share = sc.get(outcome, 0)
            payout += shares * payoff_per_share  # token pays $1 if it wins, else $0

        pnl = payout - total_cost
        row = {
            "scenario": name,
            "payout($)": round(payout, 2),
            "cost_basis($)": round(total_cost, 2),
            "PnL($)": round(pnl, 2),
            "ROI(%)": round(100 * pnl / total_cost, 2) if total_cost != 0 else None
        }
        if probs:
            row["prob"] = probs.get(name, 0.0)
            row["EV_contrib($)"] = row["PnL($)"] * row["prob"]
        rows.append(row)

    df = pd.DataFrame(rows)
    if probs:
        df["prob"] = df["prob"].round(4)
        df["EV_contrib($)"] = df["EV_contrib($)"].round(2)
        ev = df["EV_contrib($)"].sum()
    else:
        ev = None

    summary = {
        "best_case_PnL": df["PnL($)"].max(),
        "worst_case_PnL": df["PnL($)"].min(),
        "expected_PnL": ev if ev is not None else "N/A",
        "total_cost": round(total_cost, 2)
    }
    return df.sort_values("PnL($)"), summary


if __name__ == "__main__":
    # Example usage
    df, summary = simulate_portfolio(positions, scenarios)
    st.write(df)
    st.write("Summary:", summary)

    # Display the best and worst case scenarios
    st.subheader("Best Case Scenario")
    best_case = df.loc[df["PnL($)"].idxmax()]
    st.write(best_case)

    st.subheader("Worst Case Scenario")
    worst_case = df.loc[df["PnL($)"].idxmin()]
    st.write(worst_case)