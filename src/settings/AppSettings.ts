const HXDRAccessToken = "HXDRAccessToken";
const HXDRRefreshToken = "HXDRRefreshToken";


const MyTokens = {

} as any
export const AppSettings = {
  HxDRServer: 'https://uat-hxdr.com',
  getToken() {
    return MyTokens[HXDRAccessToken] || null;
  },
  getRefreshToken() {
    return MyTokens[HXDRRefreshToken] || null;
  },
  setToken(token: string) {
    MyTokens[HXDRAccessToken] = token;
  },
  setRefreshToken(token: string) {
    MyTokens[HXDRRefreshToken] = token;
  },
  removeRefreshToken() {
    MyTokens[HXDRRefreshToken] = undefined;
    delete MyTokens[HXDRRefreshToken];
  }
}


