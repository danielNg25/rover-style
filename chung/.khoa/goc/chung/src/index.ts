import {registerRoot} from 'remotion';
import {RootOf} from './Root';
import {KenhComps} from '../../kenh';
// File vào chứa MỌI kênh: dùng cho kiểm kiểu và các lệnh cũ. Dựng hình hằng ngày đi qua file vào của từng kênh
// (../kenh/<kênh>/entry.ts, do still.sh / render-video.sh / tools chọn theo KENH hoặc dang-lam.yaml).
registerRoot(RootOf(KenhComps));
