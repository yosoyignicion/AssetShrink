#ifndef ASSETSHRINK_TOOLS_H
#define ASSETSHRINK_TOOLS_H

namespace httplib {
class Server;
}

namespace assetshrink {

void register_optimize(httplib::Server& svr);
void register_resize(httplib::Server& svr);
void register_palette(httplib::Server& svr);
void register_beautify(httplib::Server& svr);
void register_qr(httplib::Server& svr);

}  // namespace assetshrink

#endif  // ASSETSHRINK_TOOLS_H
