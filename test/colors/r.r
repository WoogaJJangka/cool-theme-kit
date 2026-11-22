# 한글 주석
max_size <- 10L
names <- c("하나", 'two')

greet <- function(name, times = 2) {
  if (is.null(name)) {
    return(NULL)
  }
  paste0("Hello ", name, "\n", collapse = "")
}

result <- sapply(names, greet, times = TRUE)
print(result[1] %in% names)
