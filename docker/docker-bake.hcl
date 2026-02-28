variable "TAG" {
  default = "develop"
}

variable "NEXT_PUBLIC_GA_MEASUREMENT_ID" {
  default = ""
}

variable "NEXT_PUBLIC_NAVER_SITE_VERIFICATION" {
  default = ""
}

variable "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION" {
  default = ""
}

variable "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" {
  default = ""
}

variable "DATABASE_URL" {
  default = "postgresql://dummy:dummy@localhost:5432/dummy"
}

group "default" {
  targets = ["web", "worker", "travel"]
}

target "_common" {
  context    = ".."
  platforms  = ["linux/arm64"]
  cache-from = ["type=gha,scope=build"]
  cache-to   = ["type=gha,scope=build,mode=max"]
}

target "web" {
  inherits   = ["_common"]
  dockerfile = "docker/web.Dockerfile"
  tags       = ["kihoonbae/binbang:web-${TAG}"]
  args = {
    NEXT_PUBLIC_GA_MEASUREMENT_ID        = NEXT_PUBLIC_GA_MEASUREMENT_ID
    NEXT_PUBLIC_NAVER_SITE_VERIFICATION  = NEXT_PUBLIC_NAVER_SITE_VERIFICATION
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  }
}

target "worker" {
  inherits   = ["_common"]
  dockerfile = "docker/worker.Dockerfile"
  tags       = ["kihoonbae/binbang:worker-${TAG}"]
}

target "travel" {
  inherits   = ["_common"]
  dockerfile = "docker/travel.Dockerfile"
  tags       = ["kihoonbae/binbang:travel-${TAG}"]
  args = {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    DATABASE_URL                    = DATABASE_URL
  }
}
