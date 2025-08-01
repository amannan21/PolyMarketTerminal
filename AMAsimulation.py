import streamlit as st



import numpy as np

def cost(q, b):
    """LMSR cost function C(q). q: np.array of shares sold, b: liquidity (USDC)."""
    return b * np.log(np.exp(q / b).sum())

def prices(q, b):
    """Softmax prices."""
    w = np.exp(q / b)
    return w / w.sum()

def trade_cost(q, delta, b):
    """Exact dollars to move inventory from q to q+delta."""
    return cost(q + delta, b) - cost(q, b)

def trade(q, b, outcome_idx, shares):
    """
    Buy (shares>0) or sell (shares<0) `shares` of outcome_idx.
    Returns: new_q, dollars_spent, new_prices
    """
    delta = np.zeros_like(q, dtype=float)
    delta[outcome_idx] = shares
    dollars = trade_cost(q, delta, b)
    new_q = q + delta
    return new_q, dollars, prices(new_q, b)

def jacobian(q, b):
    """
    ∂p_i/∂q_j matrix at state q. Useful for small cross‑impact estimates.
    J[i,j] = (1/b) * p_i * (δ_ij - p_j)
    """
    p = prices(q, b)
    n = len(p)
    I = np.eye(n)
    return (p[:, None] * (I - p[None, :])) / b

# ----------- Demo -----------

# I could potentially use the polymarket subgraph and the Model to simulate market trade here 

if __name__ == "__main__":
    # 3-outcome market: [Zootopia, Minecraft, Wicked]
    b = 100.0
    q = np.zeros(3)

    print("Initial prices:", prices(q, b))

    # Buy 50 shares of Zootopia
    q, spent, p = trade(q, b, outcome_idx=0, shares=50)
    print(f"\nBought 50 Zootopia shares, spent ${spent:.2f}")
    print("New prices:", p)

    # Cross-impact estimate if we buy 10 more Zootopia shares
    J = jacobian(q, b)
    dp_est = J[:, 0] * 10  # column 0 is impact from Zootopia inventory
    print("\nJacobian price change estimate for +10 Zoo shares:", dp_est)

    # Check against exact move
    q2, spent2, p2 = trade(q, b, 0, 10)
    print(f"Exact new prices after +10 shares:", p2)
    print("Exact Δp:", p2 - p)
