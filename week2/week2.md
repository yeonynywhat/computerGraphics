Task 1 — 실제 비율로 만들기

-- 사용한 실제 수치와 변환 --

대상 인공위성은 국제우주정거장(ISS)으로 정했다. 지구 반지름은 6,371 km, 달 반지름은 1,737.4 km, 지구와 달의 평균 중심 거리는 384,400 km를 사용했다. ISS는 고도 약 400 km, 대표 길이 약 109 m로 가정했다.

지구 반지름을 1단위로 두고 다음과 같이 변환했다.

| 물체  | 크기 배율               | 지구 중심에서의 거리                |
| --- | ------------------- | -------------------------- |
| 지구  | 1                   | 0                          |
| 달   | `1737.4/6371`       | `384400/6371` ≈ 60.34      |
| ISS | `109/(6371000*5.2)` | `(6371+400)/6371` ≈ 1.0628 |

ISS는 데모 모형의 전체 x축 길이가 5.2단위이므로, 대표 길이 109m에 맞춰 배율을 계산했다. ISS의 실제 형상을 정밀하게 재현한 것은 아니며, 대표 길이를 기준으로 비율을 맞춘 것이다.

1. 거리의 단위를 무엇으로 정했는가? 왜 그렇게 정했는가?

지구 반지름 6,371 km를 1단위로 정했다. 지구를 기준으로 달과 ISS의 크기 및 거리를 같은 비율로 표현하기 위해서다. km를 그대로 사용하면 숫자가 너무 커지므로, 지구 반지름으로 나누어 다루기 쉬운 값으로 만들었다.

2. 숫자가 커서 생긴 문제가 있었는가? 있었다면 무엇인가?

있었다. 달의 실제 거리를 적용하자 지구에서 약 60.34단위 떨어져 화면에서 매우 작고 멀게 보였다. 이를 확인하기 위해 축 범위를 65로 늘렸다.

반대로 ISS는 실제 크기 배율이 약 0.00000329로 매우 작아서 화면에서 거의 보이지 않았다. 방향을 확인할 때만 크기를 임시로 0.15로 키웠고, 확인 후 실제 비율로 되돌렸다. 실제 비율에서는 지구·달,ISS를 모두 보기 쉽게 표현하기 어렵다는 점을 확인했다.

3. 달,위성이 지구를 향하게 만든 것은 어느 변환 단계 덕분인가?

이동 T와 크기 S 사이에 넣은 회전이 기본 방향을 지구 쪽으로 보정했다. 달과 ISS가 지구의 +X 방향에 있을 때 로컬 +X 방향을 −X 방향으로 돌린 것이다.

또한 맨 왼쪽의 공전 회전이 위치와 방향을 함께 회전시키므로, 공전 중에도 지구를 향하는 방향이 유지된다. 행렬은 오른쪽부터 적용되므로 크기 조절 → 방향 보정 → 궤도 거리로 이동 → 공전 순서로 작동한다. 두 공전 속도는 실제 공전주기가 아니라 실습에서 움직임을 확인하기 위한 값이다.


Task 2 — NDC 범위에 맞추기

1. 어떤 변환을 어디에 추가했는가? 물체마다 따로 넣었는가, 공통으로 넣었는가?

Task 1에서 만든 지구/달/ISS의 변환을 유지하고, 세 물체의 변환 행렬 **맨 왼쪽에 균등 스케일 1/65 를 추가했다. 도구에서는 물체마다 각각 입력했지만, 세 물체에 동일한 배율을 적용했으므로 공통 스케일을 적용한 것과 같다. 맨 왼쪽에 배치했기 때문에 기존의 크기뿐 아니라 이동 거리도 함께 축소된다. 달과 ISS의 공전 회전 및 방향 보정 행렬은 그대로 유지했다.

2. 실제 비율을 유지한 채로 넣었는가? 유지했다면 화면에서 무엇이 보이는가?

실제 비율을 유지했다. 모든 물체의 크기와 거리에 동일한 '1/65' 를 적용했으므로 물체 사이의 상대적인 크기와 거리 비율은 변하지 않는다.

축 범위를 x·y·z 모두 1로 설정한 뒤, 지구는 중앙에 작은 구로 보이고 달은 멀리 떨어진 작은 점으로 보였다. ISS는 지구에 비해 매우 작아서 화면에서 거의 구분할 수 없었다. 이를 통해 실제 비율을 유지하는 것과 모든 물체를 알아보기 쉽게 표현하는 것은 서로 다른 문제임을 확인했다.

https://cg.catholic.ac.kr/~mgchoi/CG/demos/d02-transform-lab.html?d=eyJyYW5nZSI6eyJ4IjoiMSIsInkiOiIxIiwieiI6IjEifSwib2JqZWN0cyI6W3siaWQiOiJlYXJ0aCIsIm5hbWUiOiLsp4DqtawiLCJjb2xvciI6WzAuMzUsMC42LDAuOTVdLCJzdGVwcyI6W3sidHlwZSI6IlN1IiwiYXJncyI6WyIxLzY1Il19XX0seyJpZCI6Im1vb24iLCJuYW1lIjoi64usIiwiY29sb3IiOlswLjc4LDAuNzgsMC44Ml0sInN0ZXBzIjpbeyJ0eXBlIjoiU3UiLCJhcmdzIjpbIjEvNjUiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqMjAiXX0seyJ0eXBlIjoiVCIsImFyZ3MiOlsiMzg0NDAwLzYzNzEiLCIwIiwiMCJdfSx7InR5cGUiOiJSeiIsImFyZ3MiOlsiMTgwIl19LHsidHlwZSI6IlN1IiwiYXJncyI6WyIxNzM3LjQvNjM3MSJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyIwIiwiMCIsIjAiXX1dfSx7ImlkIjoic2F0IiwibmFtZSI6IuyduOqzteychOyEsSIsImNvbG9yIjpbMC45NSwwLjcyLDAuMzVdLCJzdGVwcyI6W3sidHlwZSI6IlN1IiwiYXJncyI6WyIxLzY1Il19LHsidHlwZSI6IlJ6IiwiYXJncyI6WyJ0KjQwIl19LHsidHlwZSI6IlQiLCJhcmdzIjpbIig2MzcxKzQwMCkvNjM3MSIsIjAiLCIwIl19LHsidHlwZSI6IlJ6IiwiYXJncyI6WyIxODAiXX0seyJ0eXBlIjoiU3UiLCJhcmdzIjpbIjEwOS8oNjM3MTAwMCo1LjIpIl19XX1dfQ%3D%3D

Task 3 — 보는 사람을 위한 표현

1. 실제 비율이 정보를 전달하기에 적합한가? 그 이유는?

실제 비율은 지구·달·ISS의 크기와 거리 차이를 정확하게 보여 주는 데 적합하다. 하지만 세 물체의 위치와 움직임을 한 화면에서 알아보기에는 불편했다. Task 2에서는 지구가 작게 보이고 달은 멀리 떨어진 작은 점으로 보였으며, ISS는 너무 작아서 거의 구분할 수 없었다. 따라서 이번에는 실제 크기의 정확성보다 세 물체를 알아보고 공전 관계를 이해하는 것을 우선하기로 했다.

2. 더 나은 표현 방법을 제안하고 실제로 만들기

크기만 과장하는 방법을 사용했다. Task 2의 공통 스케일 1/65, 공전 거리, 회전 행렬은 그대로 유지하고 달과 ISS의 크기 배율만 변경했다.

| 물체  | Task 3 크기 설정             | 변경 내용                  |
| --- | ------------------------ | ---------------------- |
| 지구  | `1/65`                   | 그대로 유지                 |
| 달   | `S(1/65) · ... · S(4)`   | 기존 실제 크기 배율을 `4`로 변경   |
| ISS | `S(1/65) · ... · S(0.5)` | 기존 실제 크기 배율을 `0.5`로 변경 |

달의 최종 반지름은 4/65 가 되었고, ISS도 원래보다 크게 표시되도록 했다. 달과 ISS의 공전 거리 및 지구를 향하게 하는 회전은 변경하지 않았다. 처음에는 달 크기를 15로 설정했지만 화면에서 너무 크게 보여 4 로 조정했다.

3. 제안한 방법의 장점과 잃는 점

장점: 달이 작은 점이 아니라 구로 보여 지구와 달의 위치 관계를 알아보기 쉬워졌다. ISS도 실제 비율일 때보다 크게 표현할 수 있어, 지구 가까이에서 공전하는 물체라는 점을 전달하기에 유리하다. 또한 공전 거리와 회전 행렬은 유지했으므로, 크기 표현을 바꾸면서도 기존의 궤도 배치를 비교할 수 있다.

잃는 점: 달과 ISS의 크기가 실제 비율보다 과장되었으므로, 화면만 보고 실제 크기를 판단하면 잘못 이해할 수 있다. 특히 달이 지구에 비해 실제보다 크게 보인다. 따라서 이 결과는 실제 크기를 정확하게 보여 주는 그림이 아니라, 위치와 공전 관계를 이해하기 위한 것이라고 설명해야 한다.

결과

Task 3에서는 실제 비율을 일부 포기하는 대신, 달과 ISS를 더 알아보기 쉽게 표현했다. 이를 통해 그래픽스에서는 모든 수치를 실제와 같게 만드는 것뿐 아니라, 무엇을 전달하려는지에 따라 적절한 표현 방법을 선택하는 것도 중요하다는 점을 확인했다.

https://cg.catholic.ac.kr/~mgchoi/CG/demos/d02-transform-lab.html?d=eyJyYW5nZSI6eyJ4IjoiMSIsInkiOiIxIiwieiI6IjEifSwib2JqZWN0cyI6W3siaWQiOiJlYXJ0aCIsIm5hbWUiOiLsp4DqtawiLCJjb2xvciI6WzAuMzUsMC42LDAuOTVdLCJzdGVwcyI6W3sidHlwZSI6IlN1IiwiYXJncyI6WyIxLzY1Il19XX0seyJpZCI6Im1vb24iLCJuYW1lIjoi64usIiwiY29sb3IiOlswLjc4LDAuNzgsMC44Ml0sInN0ZXBzIjpbeyJ0eXBlIjoiU3UiLCJhcmdzIjpbIjEvNjUiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqMjAiXX0seyJ0eXBlIjoiVCIsImFyZ3MiOlsiMzg0NDAwLzYzNzEiLCIwIiwiMCJdfSx7InR5cGUiOiJSeiIsImFyZ3MiOlsiMTgwIl19LHsidHlwZSI6IlN1IiwiYXJncyI6WyI0Il19LHsidHlwZSI6IlQiLCJhcmdzIjpbIjAiLCIwIiwiMCJdfV19LHsiaWQiOiJzYXQiLCJuYW1lIjoi7J246rO17JyE7ISxIiwiY29sb3IiOlswLjk1LDAuNzIsMC4zNV0sInN0ZXBzIjpbeyJ0eXBlIjoiU3UiLCJhcmdzIjpbIjEvNjUiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqNDAiXX0seyJ0eXBlIjoiVCIsImFyZ3MiOlsiKDYzNzErNDAwKS82MzcxIiwiMCIsIjAiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbIjE4MCJdfSx7InR5cGUiOiJTdSIsImFyZ3MiOlsiMC41Il19XX1dfQ%3D%3D


