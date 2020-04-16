#include <ek/system/working_dir.hpp>
#include <ek/system/system.hpp>
#include <ek/util/logger.hpp>
#include <ek/util/strings.hpp>
#include <ek/editor/marketing/export_marketing.hpp>
#include <ek/editor/assets/editor_project.hpp>

using namespace ek;

// Marketing Resources generation:
// 1) Export command
// - what to export
// - platform
// - file/dir
// - type
// - output
// `ekc export market assets/res web generated/web`
int main(int argc, char* argv[]) {
    using namespace std;

    EK_INFO << "== EKC util ==";
    EK_INFO << "Executable path: " << get_executable_path();
    EK_INFO << "Working dir: " << current_working_directory();
    EK_INFO << "Arguments: ";
    std::vector<std::string> args;
    for(int i = 0; i < argc; ++i) {
        args.emplace_back(argv[i]);
    }

    EK_INFO << join(args, " ");

    if (args.size() <= 1) {
        return 0;
    }

    if (args.size() > 1) {
        if (args[1] == "export") {
            if (args.size() > 2) {
                auto what = args[2];
                if (what == "market") {
                    marketing_asset_t marketing_data{};
                    marketing_data.input = path_t{args[3]};
                    marketing_data.commands.push_back({
                                                              args[4],
                                                              path_t{args[5]}
                                                      });
                    process_market_asset(marketing_data);
                } else if (what == "assets") {
                    editor_project_t project{};
                    project.base_path = path_t{args[3]};
                    project.populate();
                    project.build(path_t{args[4]});
                }
            }
        }
    }
    return 0;
}