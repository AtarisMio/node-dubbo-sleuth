// This file is created by egg-ts-helper@1.24.2
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportTest from '../../../app/service/Test';

declare module 'egg' {
  interface IService {
    test: ExportTest;
  }
}
