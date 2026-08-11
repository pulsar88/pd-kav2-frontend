const Total = (props: { total: number }) => {
    const { total } = props
    return (
        <div className="pagination-total mr-auto">
            Всего <span>{total}</span> помещений
        </div>
    )
}

export default Total
