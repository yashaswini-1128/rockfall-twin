import numpy as np, math

class TwinKF:
    def __init__(self, dt=1/12):
        self.dt = dt
        self.x  = np.array([[0.0],[0.0],[10.0]])   # [u, v, p]
        self.P  = np.eye(3)*5
        self.Q  = np.diag([0.05,0.05,0.1])
        self.R  = np.diag([0.5,0.5,0.7])
        self.beta, self.gamma, self.alpha = 0.97, 0.10, 0.03

    def predict(self, rain):
        u,v,p = self.x.flatten()
        v_ = max(0.0, v + self.alpha*rain)
        u_ = u + v*self.dt
        p_ = self.beta*p + self.gamma*rain
        F = np.array([[1,self.dt,0],[0,1,0],[0,0,self.beta]])
        self.x = np.array([[u_],[v_],[p_]])
        self.P = F@self.P@F.T + self.Q

    def update(self, u=None, v=None, p=None):
        if u is not None: self.x[0,0] = 0.7*self.x[0,0] + 0.3*u
        if v is not None: self.x[1,0] = 0.7*self.x[1,0] + 0.3*v
        if p is not None: self.x[2,0] = 0.7*self.x[2,0] + 0.3*p

def fs_proxy(u,v,p,slope_deg=55):
    return max(0.0, 1.0 - (abs(v)/5.0 + p/100.0 + math.tan(math.radians(slope_deg))/3))
