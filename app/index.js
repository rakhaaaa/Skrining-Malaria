// Mengimpor registerRootComponent dari Expo utk daftarkn komponen utama aplikasi.
import { registerRootComponent } from 'expo';

// Mengimpor komponen App sbg komponen utama aplikasi.
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
