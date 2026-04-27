class TokenStorage {
  private readonly TOKEN_KEY = "authToken";

  setToken(token: string, rememberMe: boolean = false): void {
    if (typeof window !== "undefined") {
      if (rememberMe) {
        localStorage.setItem(this.TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(this.TOKEN_KEY, token);
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
  }
}

export const tokenStorage = new TokenStorage();
