cmake_minimum_required(VERSION 3.15)
project(AssetShrink VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Threads REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_check_modules(WEBP REQUIRED libwebp)

set(RESOURCE_FILES "")
if(WIN32)
    if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/app.ico")
        file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/resources.rc "id ICON \"${CMAKE_CURRENT_SOURCE_DIR}/app.ico\"")
        set(RESOURCE_FILES ${CMAKE_CURRENT_BINARY_DIR}/resources.rc)
    endif()
elseif(APPLE)
    if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/app.icns")
        set(RESOURCE_FILES "${CMAKE_CURRENT_SOURCE_DIR}/app.icns")
        set_source_files_properties(${RESOURCE_FILES} PROPERTIES MACOSX_PACKAGE_LOCATION Resources)
        set(MACOSX_BUNDLE_ICON_FILE "app.icns")
    endif()
endif()

if(WIN32)
    add_executable(AssetShrink WIN32 main.cpp ${RESOURCE_FILES})
    set_target_properties(AssetShrink PROPERTIES LINK_FLAGS "/SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup")
elseif(APPLE)
    add_executable(AssetShrink MACOSX_BUNDLE main.cpp ${RESOURCE_FILES})
else()
    add_executable(AssetShrink main.cpp)
endif()

include(FetchContent)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG        v0.14.1
)
FetchContent_Declare(
    stb
    GIT_REPOSITORY https://github.com/nothings/stb.git
    GIT_TAG        master
)
FetchContent_MakeAvailable(httplib stb)

target_include_directories(AssetShrink PRIVATE ${stb_SOURCE_DIR} ${WEBP_INCLUDE_DIRS})
target_link_libraries(AssetShrink PRIVATE httplib Threads::Threads ${WEBP_LIBRARIES})
