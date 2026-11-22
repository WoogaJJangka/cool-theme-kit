import os
from typing import Any

MAX_SIZE = 10  # 한글 주석


@dataclass
class Greeter(Base):
    """인사하는 클래스."""

    def greet(self, name: str, times=2) -> str:
        text = f"Hello {name}\n"
        print(len(text), sep="")
        return self.prefix + text


import asyncio
import re


class Counter(dict[str, int]):
    """세는 클래스."""

    LIMIT: int = 0x10
    enabled = True

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.total = 0

    @classmethod
    def create(cls, items: list[str] | None = None) -> "Counter":
        return cls({item: 1 for item in items or []})

    @property
    def size(self):
        return sum(value for value in self.values() if value > 0)


async def fetch(url: str, *, timeout: float = 1.5e3) -> bytes:
    pattern = re.compile(r"^https?://(\w+)$")
    if (found := pattern.match(url)) is None:
        raise ValueError(f"잘못된 주소: {url!r:>10}")
    await asyncio.sleep(timeout)
    data = b"\x00\xff" + rb"\d"
    callback = lambda value: not value and False
    match found.group(1):
        case "a" | "b":
            pass
    return data
