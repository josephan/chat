defmodule Chat.Message do
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query


  schema "messages" do
    field :body, :string
    field :topic, :string
    field :user, :string

    timestamps()
  end

  @doc false
  def changeset(message, attrs) do
    message
    |> cast(attrs, [:topic, :user, :body])
    |> validate_required([:topic, :user, :body])
  end

  def recent(topic) do
    from m in __MODULE__,
      where: m.topic == ^topic,
      order_by: [asc: :inserted_at],
      limit: 50
  end
end
