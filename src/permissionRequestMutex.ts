import {Mutex} from 'async-mutex';

const permissionRequestMutex = new Mutex();

export default permissionRequestMutex;
