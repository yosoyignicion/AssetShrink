cmake_minimum_required(VERSION 3.15)
project(AssetShrink VERSION 3.2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Generar config.h con la versión desde CMake (single source of truth)
configure_file(config.h.in ${CMAKE_CURRENT_BINARY_DIR}/config.h)

include(FetchContent)
FetchContent_Declare(
    stb
    GIT_REPOSITORY https://github.com/nothings/stb.git
    GIT_TAG        master
)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG        v0.14.1
)
FetchContent_MakeAvailable(httplib stb)

find_package(Threads REQUIRED)

# --- Buscar la librería WebP de manera multiplataforma inteligente ---
if(WIN32)
    find_package(WebP CONFIG REQUIRED)
    set(WEBP_LIBRARIES WebP::webp WebP::webpdecoder)
    set(WEBP_INCLUDE_DIRS "")
elseif(APPLE)
    find_path(WEBP_INCLUDE_DIR NAMES webp/encode.h PATHS /opt/homebrew/include /usr/local/include)
    find_library(WEBP_LIBRARY NAMES webp PATHS /opt/homebrew/lib /usr/local/lib)
    find_library(WEBP_DECODER_LIBRARY NAMES webpdecoder PATHS /opt/homebrew/lib /usr/local/lib)

    if(WEBP_INCLUDE_DIR AND WEBP_LIBRARY)
        set(WEBP_LIBRARIES ${WEBP_LIBRARY} ${WEBP_DECODER_LIBRARY})
        set(WEBP_INCLUDE_DIRS ${WEBP_INCLUDE_DIR})
    else()
        message(FATAL_ERROR "No se pudo encontrar libwebp de forma nativa en macOS")
    endif()
else()
    find_package(PkgConfig REQUIRED)
    pkg_check_modules(WEBP REQUIRED libwebp)
endif()

# --- Embeber assets web (HTML/CSS/JS) en build-time ---
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/embed_assets.cmake)
set(ASSETS_GENERATED ${CMAKE_CURRENT_BINARY_DIR}/assets_generated.cpp)
set(WEB_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src/web)
file(GLOB_RECURSE WEB_FILES "${WEB_DIR}/*")
add_custom_command(
    OUTPUT ${ASSETS_GENERATED}
    COMMAND ${CMAKE_COMMAND}
        -DWEB_DIR=${WEB_DIR}
        -DOUT_CPP=${ASSETS_GENERATED}
        -P ${CMAKE_CURRENT_SOURCE_DIR}/cmake/embed_assets.cmake
    DEPENDS ${WEB_FILES} ${CMAKE_CURRENT_SOURCE_DIR}/cmake/embed_assets.cmake
    COMMENT "Embedding web assets into ${ASSETS_GENERATED}"
    VERBATIM
)
set_source_files_properties(${ASSETS_GENERATED} PROPERTIES GENERATED TRUE)

# Iconos nativos según plataforma
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

set(SOURCES
    src/main.cpp
    src/core/image_io.cpp
    src/core/assets.cpp
    src/tools/optimize.cpp
    src/tools/resize.cpp
    src/tools/palette.cpp
    src/tools/beautify.cpp
    src/tools/qr.cpp
    third_party/qrcodegen.cpp
    ${ASSETS_GENERATED}
)

if(WIN32)
    add_executable(AssetShrink WIN32 ${SOURCES} ${RESOURCE_FILES})
    set_target_properties(AssetShrink PROPERTIES LINK_FLAGS "/SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup")
elseif(APPLE)
    add_executable(AssetShrink MACOSX_BUNDLE ${SOURCES} ${RESOURCE_FILES})
else()
    add_executable(AssetShrink ${SOURCES})
endif()

target_include_directories(AssetShrink PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
    ${stb_SOURCE_DIR}
    ${WEBP_INCLUDE_DIRS}
    ${CMAKE_CURRENT_BINARY_DIR}
)

target_link_libraries(AssetShrink PRIVATE httplib Threads::Threads ${WEBP_LIBRARIES})
